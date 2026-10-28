import React from 'react';
import { SqlPage } from '../CenterPages';
import { RuntimeMonitor } from '../CollectionPages';

export function BidDataQuery() {
  return <SqlPage />;
}

export function BidMonitor() {
  return <RuntimeMonitor title="监控总览" eyebrow="MONITOR OVERVIEW" />;
}
