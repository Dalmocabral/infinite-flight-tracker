import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from '@mui/material';
import { forwardRef, useState } from 'react';
import { FaPlane, FaSearch, FaTimes } from "react-icons/fa";
import { TableVirtuoso } from 'react-virtuoso';
import getAircraft from "./GetAircraft.json";
import "./PilotsSidebar.css";

// Custom Table Components for Virtuoso
const VirtuosoTableComponents = {
  Scroller: forwardRef((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} style={{ ...props.style, backgroundColor: 'transparent', boxShadow: 'none' }} />
  )),
  Table: (props) => (
    <Table {...props} style={{ ...props.style, borderCollapse: 'separate' }} />
  ),
  TableHead: forwardRef((props, ref) => (
      <TableHead {...props} ref={ref} />
  )),
  TableRow: ({ item: _item, ...props }) => <TableRow {...props} />,
  TableBody: forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
};

const fixedHeaderContent = () => (
  <TableRow>
    <TableCell style={{ backgroundColor: '#121212', color: '#888', fontWeight: 600, width: '15%' }}>Callsign</TableCell>
    <TableCell style={{ backgroundColor: '#121212', color: '#888', fontWeight: 600, width: '20%' }}>Username</TableCell>
    <TableCell style={{ backgroundColor: '#121212', color: '#888', fontWeight: 600, width: '25%' }}>Aircraft</TableCell>
    <TableCell style={{ backgroundColor: '#121212', color: '#888', fontWeight: 600, width: '15%' }}>Altitude</TableCell>
    <TableCell style={{ backgroundColor: '#121212', color: '#888', fontWeight: 600, width: '15%' }}>Speed</TableCell>
    <TableCell style={{ backgroundColor: '#121212', color: '#888', fontWeight: 600, width: '10%' }}>Heading</TableCell>
  </TableRow>
);

const PilotsSidebar = ({ isVisible, flightsData, onSelectFlight, onClose }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredFlights = flightsData ? flightsData.filter(flight => {
        const search = searchTerm.toLowerCase();
        const callsign = (flight.callsign || "").toLowerCase();
        const username = (flight.username || "").toLowerCase();
        const displayCallsign = (flight.displayCallsign || "").toLowerCase();
        
        return callsign.includes(search) || 
               username.includes(search) || 
               displayCallsign.includes(search);
    }) : [];

    const getAircraftName = (id) => {
        const aircraft = getAircraft.result.find(a => a.id === id);
        return aircraft ? aircraft.name : "Unknown Aircraft";
    };

    const rowContent = (_index, flight) => {
        return (
            <>
                <TableCell style={{ color: '#4dabf5', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{flight.callsign}</TableCell>
                <TableCell style={{ color: '#e0e0e0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{flight.username || "Anonymous"}</TableCell>
                <TableCell style={{ color: '#aaa', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{getAircraftName(flight.aircraftId)}</TableCell>
                <TableCell style={{ color: '#e0e0e0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{Math.round(flight.altitude).toLocaleString()} ft</TableCell>
                <TableCell style={{ color: '#e0e0e0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{Math.round(flight.speed)} kts</TableCell>
                <TableCell style={{ color: '#e0e0e0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{Math.round(flight.heading)}°</TableCell>
            </>
        );
    };

    return (
        <Dialog 
            open={isVisible} 
            onClose={onClose}
            maxWidth="xl" 
            fullWidth
            PaperProps={{
                style: {
                    backgroundColor: 'rgba(18, 18, 18, 0.95)',
                    backdropFilter: 'blur(10px)',
                    color: '#e0e0e0',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    height: '80vh'
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '16px 24px',
                height: '80px' // Fixed height for header
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaPlane style={{ color: '#4dabf5' }} />
                    <span style={{ fontWeight: 700 }}>Live Pilots</span>
                    <span className="pilot-count-badge">{filteredFlights.length}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <TextField 
                        variant="outlined" 
                        size="small" 
                        placeholder="Search pilot or callsign..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FaSearch color="#666" />
                                </InputAdornment>
                            ),
                            style: { 
                                color: '#fff', 
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px' 
                            }
                        }}
                        sx={{ 
                            width: 300,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4dabf5' },
                        }}
                    />
                    <IconButton onClick={onClose} style={{ color: '#888' }}>
                        <FaTimes />
                    </IconButton>
                </div>
            </DialogTitle>

            <DialogContent style={{ padding: 0, height: 'calc(100% - 80px)' }}> 
                {filteredFlights.length > 0 ? (
                    <TableVirtuoso
                        data={filteredFlights}
                        components={VirtuosoTableComponents}
                        fixedHeaderContent={fixedHeaderContent}
                        itemContent={rowContent}
                        style={{ height: '100%', width: '100%' }}
                        context={{ onSelectFlight }}
                    />
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        No pilots found.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

// Re-defining TableRow to support onClick
VirtuosoTableComponents.TableRow = ({ item, ...props }) => {
    // We need to access the 'item' (flight) data to pass to click handler.
    // However, itemContent receives the item. props here is just DOM props.
    // Virtuoso handles item in itemContent.
    // To support clicking the row, we effectively need to attach onClick to the TR.
    // Since we can't easily pass the 'onSelectFlight' down to this static component definition without context or prop-drilling which Virtuoso makes hard...
    // A trick is to use `context` prop of TableVirtuoso.
    
    return <TableRow {...props} 
        onClick={() => props.context?.onSelectFlight && props.context.onSelectFlight(item)}
        sx={{ 
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'pointer' },
            transition: 'background-color 0.2s' 
        }} 
    />;
};

export default PilotsSidebar;
