import React from 'react';
import ReportDialog from './ReportDialog';

interface ReportEventDialogProps {
  eventId: string;
  eventTitle: string;
}

const ReportEventDialog: React.FC<ReportEventDialogProps> = ({ eventId, eventTitle }) => {
  return <ReportDialog type='event' eventId={eventId} eventTitle={eventTitle} />;
};

export default ReportEventDialog;
