import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { SidePanelApp } from './SidePanelApp';
import './styles.css';
import './milestone2c.css';
import './markdown.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Side panel root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <SidePanelApp />
  </StrictMode>,
);
