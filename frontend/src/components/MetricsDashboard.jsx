import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { Card, Grid, Typography, Box, Alert, CircularProgress } from '@mui/material';

const MetricsDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsResponse, alertsResponse] = await Promise.all([
          axios.get('/api/monitoring/metrics'),
          axios.get('/api/monitoring/alerts')
        ]);

        setMetrics(metricsResponse.data.applicationMetrics);
        setAlerts(alertsResponse.data.alerts);
        setError(null);
      } catch (err) {
        setError('Failed to fetch metrics data');
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const formatResponseTimeData = () => {
    return Object.entries(metrics.averageResponseTimes).map(([path, time]) => ({
      path: path.replace('/api/', ''),
      time
    }));
  };

  const formatErrorRateData = () => {
    return Object.entries(metrics.errorRates).map(([path, rate]) => ({
      path: path.replace('/api/', ''),
      rate
    }));
  };

  const formatRequestCountData = () => {
    return Object.entries(metrics.requestCounts).map(([path, count]) => ({
      path: path.replace('/api/', ''),
      count
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Metrics Dashboard
      </Typography>

      {alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Active Alerts
          </Typography>
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              severity={alert.severity}
              sx={{ mb: 1 }}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Average Response Times (ms)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatResponseTimeData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="path" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="time" fill="#8884d8" name="Response Time (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Error Rates (%)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatErrorRateData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="path" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#ff4444"
                  name="Error Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Request Counts
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatRequestCountData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="path" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#4CAF50" name="Request Count" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Resources
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">CPU Usage</Typography>
                <CircularProgress
                  variant="determinate"
                  value={metrics.systemMetrics.cpu.load[0] * 100}
                  size={80}
                  thickness={4}
                  sx={{ color: '#2196F3' }}
                />
                <Typography>
                  {(metrics.systemMetrics.cpu.load[0] * 100).toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Memory Usage</Typography>
                <CircularProgress
                  variant="determinate"
                  value={(1 - metrics.systemMetrics.memory.free / metrics.systemMetrics.memory.total) * 100}
                  size={80}
                  thickness={4}
                  sx={{ color: '#4CAF50' }}
                />
                <Typography>
                  {((1 - metrics.systemMetrics.memory.free / metrics.systemMetrics.memory.total) * 100).toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Heap Usage</Typography>
                <CircularProgress
                  variant="determinate"
                  value={(metrics.systemMetrics.memory.heapUsed / metrics.systemMetrics.memory.heapTotal) * 100}
                  size={80}
                  thickness={4}
                  sx={{ color: '#FF9800' }}
                />
                <Typography>
                  {((metrics.systemMetrics.memory.heapUsed / metrics.systemMetrics.memory.heapTotal) * 100).toFixed(1)}%
                </Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MetricsDashboard;
