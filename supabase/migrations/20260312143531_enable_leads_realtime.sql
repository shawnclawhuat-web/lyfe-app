-- Enable Realtime on the leads table for live lead updates
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
