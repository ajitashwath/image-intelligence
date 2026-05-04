import { useState, useEffect } from 'react';
import './index.css';

// Simple SVG Icons
const Icons = {
  S3: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>,
  Lambda: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10 3-8 8 8 8M14 21l8-8-8-8"/></svg>,
  Rekognition: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>,
  SQS: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>,
  DynamoDB: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  SNS: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Play: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>,
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const cardsData = {
  s3: {
    id: 's3', type: 'type-storage', title: 'S3 · Storage', subtitle: 'Image Upload',
    body: 'User drops image → PUT object to S3 bucket with auto-generated key',
    details: 'Bucket: image-intelligence-raw\nEvents: s3:ObjectCreated\nCORS: Allowed (PUT, GET)\nLifecycle: 90 days expiration',
  },
  lambda1: {
    id: 'lambda1', type: 'type-compute', title: 'Lambda · Compute', subtitle: 'Orchestrator Function',
    body: 'Parses S3 event, extracts bucket/key, fans out to Rekognition and SQS concurrently',
    details: 'Runtime: Node 20\nMemory: 256MB\nTimeout: 30s\nExecution: Promise.all([]) fan-out',
  },
  rekognition: {
    id: 'rekognition', type: 'type-ml', title: 'Amazon Rekognition', subtitle: 'Branch A · ML',
    body: 'Detects labels, objects, text, faces & moderation flags · returns JSON confidence scores',
    details: 'MaxLabels: 20\nMinConfidence: 70%\nModeration: suggestive, violence, drugs\nResponse time: ~300–800ms',
  },
  sqs: {
    id: 'sqs', type: 'type-queue', title: 'SQS Standard Queue', subtitle: 'Branch B · Queue',
    body: 'Enqueues task message with image key, label summary, timestamp · DLQ wired for retries',
    details: 'Type: Standard Queue\nVisibility Timeout: 60s\nRetries: 3 before DLQ\nMessage Delay: 0s',
  },
  dynamo: {
    id: 'dynamo', type: 'type-database', title: 'DynamoDB · Store', subtitle: 'Metadata Persistence',
    body: 'PK: imageId · stores labels[], moderation flags, timestamps, S3 URI, confidence scores',
    details: 'PK: imageId\nGSI: UserIndex (userId, createdAt)\nTTL: 90 days\nStream: NEW_IMAGE',
  },
  sns: {
    id: 'sns', type: 'type-notify', title: 'SNS + SES · Notify', subtitle: 'User Notification',
    body: 'Fires SNS topic → Lambda consumer sends email summary or webhook callback to client',
    details: 'Topic: ImageProcessedNotification\nSubscribers: SES Email Lambda, Webhook Endpoint',
  }
};

export default function App() {
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [simState, setSimState] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const handleCardClick = (id: string) => {
    setActiveCard(id);
    setModalOpen(true);
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) return;
        
        const res = await fetch(`${apiUrl}/images?userId=user_123`);
        if (res.ok) {
          const data = await res.json();
          const liveResults = data.items.map((item: any) => ({
            id: item.imageId,
            time: new Date(item.createdAt).toLocaleTimeString(),
            labels: item.labels ? item.labels.map((l: any) => `${l.name} (${Math.round(l.confidence)}%)`) : [],
            moderation: item.moderationStatus || 'PENDING',
            status: 'COMPLETED'
          }));
          
          // Only update if we have new data to avoid overwriting simulation runs immediately
          if (liveResults.length > 0) {
            setResults(liveResults);
          }
        }
      } catch (err) {
        console.error('Failed to poll API:', err);
      }
    };

    // Poll every 5 seconds
    fetchResults();
    const intervalId = setInterval(fetchResults, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const simulateRun = () => {
    setSimState('started');
    const newResult = {
      id: `img-${Math.random().toString(36).substr(2, 5)}`,
      status: 'PROCESSING',
      labels: [],
      moderation: 'PENDING',
      time: new Date().toLocaleTimeString(),
    };
    
    setResults([newResult, ...results]);

    const stages = ['s3', 'lambda1', 'fanout', 'dynamo', 'sns', 'done'];
    let delay = 0;

    stages.forEach((stage) => {
      setTimeout(() => {
        setSimState(stage);
        
        if (stage === 'fanout') {
          // Update result midway
          setResults(prev => {
            const arr = [...prev];
            arr[0].labels = ['Person (98%)', 'City (85%)'];
            arr[0].moderation = Math.random() > 0.8 ? 'BLOCKED' : 'CLEAN';
            return arr;
          });
        }
        
        if (stage === 'sns') {
          setResults(prev => {
            const arr = [...prev];
            arr[0].status = 'COMPLETED';
            return arr;
          });
        }

        if (stage === 'done') {
          setTimeout(() => setSimState(null), 1000);
        }
      }, delay);
      delay += 800; // 800ms per stage
    });
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Event-Driven Image Intelligence</h1>
        <p>A highly concurrent, resilient pipeline using S3, Lambda, Rekognition, SQS, DynamoDB, and SNS.</p>
      </header>

      <div className="controls">
        <button className="btn btn-primary" onClick={simulateRun} disabled={!!simState}>
          <Icons.Play /> Simulate Pipeline Run
        </button>
      </div>

      <div className="pipeline">
        {/* Layer 1: S3 */}
        <div className="pipeline-row">
          <ServiceCard data={cardsData.s3} icon={<Icons.S3 />} onClick={handleCardClick} active={simState === 's3'} />
        </div>

        {/* Layer 2: Orchestrator */}
        <div className="pipeline-row">
          <ServiceCard data={cardsData.lambda1} icon={<Icons.Lambda />} onClick={handleCardClick} active={simState === 'lambda1' || simState === 's3'} />
        </div>

        {/* Layer 3: Fan-out */}
        <div className="pipeline-row" style={{ gap: '4rem' }}>
          <ServiceCard data={cardsData.rekognition} icon={<Icons.Rekognition />} onClick={handleCardClick} active={simState === 'fanout'} />
          <ServiceCard data={cardsData.sqs} icon={<Icons.SQS />} onClick={handleCardClick} active={simState === 'fanout'} />
        </div>

        {/* Layer 4: Store */}
        <div className="pipeline-row">
          <ServiceCard data={cardsData.dynamo} icon={<Icons.DynamoDB />} onClick={handleCardClick} active={simState === 'dynamo' || simState === 'fanout'} />
        </div>

        {/* Layer 5: Notify */}
        <div className="pipeline-row">
          <ServiceCard data={cardsData.sns} icon={<Icons.SNS />} onClick={handleCardClick} active={simState === 'sns' || simState === 'dynamo'} />
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="dashboard-header">
          <h3>Live Results Dashboard</h3>
          <span style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Polling via API Gateway</span>
        </div>
        
        {results.length === 0 ? (
          <div style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0'}}>
            No runs yet. Click "Simulate Pipeline Run" to begin.
          </div>
        ) : (
          results.map((r, i) => (
            <div key={i} className="result-row" style={{ animation: 'card-pulse 0.3s ease-out' }}>
              <div>
                <strong>{r.id}</strong> <span style={{color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '10px'}}>{r.time}</span>
              </div>
              <div className="tags">
                {r.labels.map((l: string, idx: number) => <span key={idx} className="tag">{l}</span>)}
              </div>
              <div style={{display: 'flex', gap: '10px'}}>
                {r.moderation !== 'PENDING' && (
                   <span className={`status-badge ${r.moderation.toLowerCase()}`}>{r.moderation}</span>
                )}
                <span style={{ color: r.status === 'COMPLETED' ? 'var(--accent-green)' : 'var(--accent-orange)'}}>
                  {r.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      <div className={`modal-overlay ${modalOpen ? 'open' : ''}`} onClick={() => setModalOpen(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setModalOpen(false)}><Icons.Close /></button>
          {activeCard && (
            <>
              <h2 style={{color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-display)'}}>
                {cardsData[activeCard as keyof typeof cardsData].title}
              </h2>
              <p style={{color: 'var(--accent-blue)', marginBottom: '1.5rem', fontSize: '0.9rem', textTransform: 'uppercase'}}>
                {cardsData[activeCard as keyof typeof cardsData].subtitle}
              </p>
              <p style={{color: 'var(--text-secondary)', lineHeight: '1.6'}}>
                {cardsData[activeCard as keyof typeof cardsData].body}
              </p>
              <div className="code-block">
                <pre>{cardsData[activeCard as keyof typeof cardsData].details}</pre>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

function ServiceCard({ data, icon, onClick, active }: any) {
  return (
    <div className={`service-card ${data.type} ${active ? 'active' : ''}`} onClick={() => onClick(data.id)}>
      <div className="card-header">
        <div className="card-icon">{icon}</div>
        <div className="card-title">
          <p>{data.subtitle}</p>
          <h3>{data.title}</h3>
        </div>
      </div>
      <div className="card-body">
        {data.body}
      </div>
    </div>
  );
}
