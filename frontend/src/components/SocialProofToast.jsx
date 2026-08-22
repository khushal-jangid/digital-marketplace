import React, { useState, useEffect } from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

const CITIES = [
  'New Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 
  'Chennai', 'Kolkata', 'Ahmedabad', 'Gurugram', 'Noida', 
  'Jaipur', 'Chandigarh', 'Indore', 'Lucknow'
];

const NAMES = [
  'Rahul S.', 'Aman K.', 'Priya D.', 'Vikram G.', 'Shreya M.',
  'Rohan V.', 'Aditya P.', 'Sneha J.', 'Karan T.', 'Divya N.',
  'Ankit B.', 'Nikhil C.', 'Siddharth R.', 'Nehal W.'
];

const MOCK_PROJECTS = [
  { title: 'AWS Serverless Image Processor', category: 'Source Code' },
  { title: 'GCP Kubernetes Dev Pipeline (IaC)', category: 'Infrastructure' },
  { title: 'Azure Cognitive AI Chat Assistant', category: 'AI Integration' },
  { title: 'Firebase Real-Time Collaboration Canvas', category: 'React Template' },
  { title: 'AWS CloudFormation VPC & ECS Infrastructure', category: 'IaC Scripts' },
  { title: 'GCP Cloud Run Microservices Boilerplate', category: 'Microservices' },
  { title: 'Dockerized Microservices SaaS Boilerplate', category: 'SaaS Boilerplate' }
];

const SocialProofToast = () => {
  const [toast, setToast] = useState(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const triggerToast = () => {
      // Pick random values
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const project = MOCK_PROJECTS[Math.floor(Math.random() * MOCK_PROJECTS.length)];
      const timeAgo = Math.floor(Math.random() * 45) + 2; // 2 to 47 minutes ago

      setToast({ name, city, project, timeAgo });
      setIsActive(true);

      // Hide after 6 seconds
      setTimeout(() => {
        setIsActive(false);
      }, 6000);
    };

    // Run first toast after 10 seconds
    const initialTimeout = setTimeout(triggerToast, 10000);

    // Repeat every 45 seconds
    const interval = setInterval(triggerToast, 45000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (!toast) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '12px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '360px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        transform: isActive ? 'translateX(0)' : 'translateX(-400px)',
        opacity: isActive ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isActive ? 'auto' : 'none'
      }}
    >
      <div style={{
        background: 'rgba(99, 102, 241, 0.15)',
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#818cf8',
        flexShrink: 0
      }}>
        <ShieldCheck size={22} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '11px', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
          Recent Purchase
        </span>
        <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600 }}>
          {toast.name} from <span style={{ color: '#e0e7ff' }}>{toast.city}</span>
        </span>
        <span style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.3 }}>
          bought <strong style={{ color: '#cbd5e1' }}>{toast.project.title}</strong>
        </span>
        <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{toast.timeAgo} minutes ago</span>
          <span>•</span>
          <span style={{ color: '#34d399', fontWeight: 600 }}>Verified Purchase ✅</span>
        </span>
      </div>
    </div>
  );
};

export default SocialProofToast;
