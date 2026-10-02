import { useEffect, useState } from 'react';
import axios from 'axios';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Table from 'react-bootstrap/Table';
import { Translate, translate } from 'app/shared/jhipster/language';
interface ReportFile {
  id: string;
  uploaded: string;
  size: number;
  month: string;
}
export default function StockReports() {
  const [files, setFiles] = useState<ReportFile[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [queued, setQueued] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const response = await axios.get<ReportFile[]>('/api/report-files');
      setFiles(response.data.sort((a, b) => b.uploaded.localeCompare(a.uploaded)));
    } catch {
      setError(translate('cloudflare.loadError'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/reports/stock-export', {});
      setQueued(true);
      await load();
    } catch {
      setError(translate('cloudflare.saveError'));
    } finally {
      setLoading(false);
    }
  };
  const download = async (file: ReportFile) => {
    setError('');
    try {
      const response = await axios.get<Blob>(`/api/report-files/${file.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `stok-raporu-${file.month}.xlsx`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError(translate('cloudflare.loadError'));
    }
  };
  return (
    <div>
      <h2>
        <Translate contentKey="cloudflare.stockReports" />
      </h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {queued && (
        <Alert variant="info">
          <Translate contentKey="cloudflare.reportQueued" />
        </Alert>
      )}
      <Button onClick={generate} disabled={loading}>
        <Translate contentKey="cloudflare.generateReport" />
      </Button>{' '}
      <Button variant="outline-secondary" onClick={load} disabled={loading}>
        <Translate contentKey="cloudflare.refresh" />
      </Button>
      <Table className="mt-3">
        <thead>
          <tr>
            <th>
              <Translate contentKey="cloudflare.reportMonth" />
            </th>
            <th>
              <Translate contentKey="cloudflare.reportCreated" />
            </th>
            <th>
              <Translate contentKey="cloudflare.reportDownload" />
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map(file => (
            <tr key={file.id}>
              <td>{file.month}</td>
              <td>{new Date(file.uploaded).toLocaleString()}</td>
              <td>
                <Button size="sm" onClick={() => download(file)}>
                  <Translate contentKey="cloudflare.reportDownload" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
