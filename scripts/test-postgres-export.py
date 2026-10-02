"""Prove the export against the bundled legacy PostgreSQL schema using synthetic records.
Requires Docker and the postgres:18.4 image. Never connects to an existing database.
"""
import json
import os
import pathlib
import subprocess
import tempfile
import uuid

APP = pathlib.Path(__file__).resolve().parents[1]
name = 'pirot-export-proof-' + uuid.uuid4().hex[:12]

def run(*args, input=None):
    return subprocess.run(args, input=input, text=True, check=True, capture_output=True).stdout

def pg(sql):
    return run('docker', 'exec', '-i', name, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-qAt', input=sql)

schema = (APP / 'tests/fixtures/legacy-postgres-schema.sql').read_text()
try:
    run('docker', 'run', '--detach', '--name', name, '--env', 'POSTGRES_PASSWORD=Synthetic-fixture-password-42', 'postgres:18.4')
    # The image's temporary initialization server accepts Unix sockets before
    # restarting. TCP readiness waits for the final server instead.
    for _ in range(40):
        ready = subprocess.run(['docker', 'exec', name, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres'], capture_output=True)
        if ready.returncode == 0:
            break
        import time
        time.sleep(0.25)
    else:
        raise RuntimeError('Isolated PostgreSQL did not start')
    pg(schema)
    pg("""INSERT INTO koop_tenant(id,tenant_name) VALUES (1,'Synthetic cooperative');
    INSERT INTO koop_user(id,login,email,password_hash,activated,tenant_id,lang_key,created_by) VALUES (5,'migration-fixture','fixture@example.invalid','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',true,1,'tr','fixture');
    INSERT INTO koop_user_authority(user_id,authority_name) VALUES (5,'ROLE_USER');
    INSERT INTO urun(id,tenant_id,urun_adi,birim,stok,musteri_fiyati,active,satista) VALUES (17,1,'Synthetic precise stock','ADET',9007199254740993.25,10.00,true,true);
    INSERT INTO kasa_hareketleri(id,tenant_id,kasa_miktar,tarih) VALUES (9,1,456.78,'2026-10-01T12:34:56');
    INSERT INTO jv_global_id(global_id_pk,local_id,type_name) VALUES (1,'17','com.koop.app.domain.Urun');
    INSERT INTO jv_commit(commit_pk,author,commit_date_instant) VALUES (1,'migration-fixture','2026-10-01T12:34:56Z');
    INSERT INTO jv_snapshot(snapshot_pk,type,state,global_id_fk,commit_fk) VALUES (1,'INITIAL','{"tenantId":1,"stok":9007199254740993.25}',1,1);
    """)
    exported = pg((APP / 'scripts/export-postgres.sql').read_text())
    with tempfile.TemporaryDirectory(prefix='pirot-migration-proof-') as temp:
        path = pathlib.Path(temp)
        source = path / 'source.ndjson'
        source.write_text(exported)
        os.chmod(source, 0o600)
        subprocess.run(['bun', 'scripts/prepare-migration.ts', str(source), str(path / 'bundles')], cwd=APP, check=True)
        bundle = json.loads((path / 'bundles/tenant-1.json').read_text())
        assert bundle['entities']['uruns'][0]['stok'] == '9007199254740993.25'
        assert bundle['expected']['balances']['stock'] == '9007199254740993.25'
        assert bundle['expected']['balances']['cash'] == '456.78'
        assert json.loads(bundle['history'][0]['after_json'])['stok'] == '9007199254740993.25'
        assert bundle['entities']['kasa-hareketleris'][0]['tarih'] == '2026-10-01T12:34:56.000Z'
        assert (path / 'bundles/directory.sql').stat().st_mode & 0o777 == 0o600
        assert (path / 'bundles/directory.sql').read_text().count('INSERT INTO users(') == 1
    print('PostgreSQL export, UTC timestamps, legacy identity hashes, JaVers history and exact reconciliation passed.')
finally:
    subprocess.run(['docker', 'rm', '--force', name], capture_output=True)
