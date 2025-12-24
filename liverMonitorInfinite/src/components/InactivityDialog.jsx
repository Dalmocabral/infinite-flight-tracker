import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { FaPowerOff } from "react-icons/fa";

const InactivityDialog = ({ open, onReconnect }) => {
    return (
        <Dialog 
            open={open} 
            disableEscapeKeyDown 
            // prevent closing by backdrop click to enforce explicit reconnect
            onClose={(event, reason) => {
                if (reason !== 'backdropClick' && reason !== 'escape') {
                    // unexpected close
                }
            }}
            PaperProps={{
                style: {
                    backgroundColor: 'rgba(20, 20, 20, 0.95)',
                    backdropFilter: 'blur(10px)',
                    color: '#e0e0e0',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                    minWidth: '300px',
                    textAlign: 'center'
                }
            }}
        >
            <DialogTitle style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <FaPowerOff size={40} color="#ff4444" />
                <span>Connection Paused</span>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" style={{ color: '#aaa', marginBottom: '10px' }}>
                    You've been inactive for a while. 
                </Typography>
                <Typography variant="body2" style={{ color: '#888' }}>
                    Data fetching has been paused to save resources.
                </Typography>
            </DialogContent>
            <DialogActions style={{ justifyContent: 'center', paddingBottom: '24px' }}>
                <Button 
                    onClick={onReconnect} 
                    variant="contained" 
                    color="primary"
                    style={{ fontWeight: 'bold', padding: '8px 32px' }}
                >
                    Reconnect
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default InactivityDialog;
