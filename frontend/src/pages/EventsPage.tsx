import { useEffect, useState } from 'react';
import { fetchMarketEvents } from '../api';
import { MarketEvent } from '../types';

const EventsPage = () => {
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeLabel, setRangeLabel] = useState<string>('');

  const buildRange = () => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 90);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    return { startStr, endStr };
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { startStr, endStr } = buildRange();
      setRangeLabel(`${startStr} - ${endStr}`);
      const data = await fetchMarketEvents(startStr, endStr);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="title">Takvim & Haber Akışı</h1>
          <p className="subtitle">
            BIST ve TEFAS odaklı piyasa olaylarını takip edin.
            {rangeLabel && ` (${rangeLabel})`}
          </p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading && <div className="card">Yükleniyor...</div>}

      {!loading && events.length === 0 && (
        <div className="card">Yakın tarihli etkinlik bulunamadı.</div>
      )}

      {!loading && events.length > 0 && (
        <div className="grid grid-2">
          {events.map((event, index) => (
            <div key={`${event.title}-${index}`} className="card">
              <div className="section-title">{event.title}</div>
              <p className="subtitle" style={{ marginTop: 0 }}>{event.date} • {event.type}</p>
              <p>{event.note}</p>
              <span className={`badge ${event.impact === 'high' ? 'badge-danger' : event.impact === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                {event.impact.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
