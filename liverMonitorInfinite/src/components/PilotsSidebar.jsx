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
import { useState } from 'react';
import { FaPlane, FaSearch, FaTimes } from "react-icons/fa";
import getAircraft from "./GetAircraft.json";
import "./PilotsSidebar.css"; // Keeping for minimal custom overrides if needed

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

    return (
        <Dialog 
            open={isVisible} 
            onClose={onClose}
            maxWidth="xl" // Very wide
            fullWidth
            PaperProps={{
                style: {
                    backgroundColor: 'rgba(18, 18, 18, 0.95)',
                    backdropFilter: 'blur(10px)',
                    color: '#e0e0e0',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    height: '80vh' // Fixed height for consistency
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '16px 24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaPlane style={{ color: '#4dabf5' }} />
                    <span style={{ fontWeight: 700 }}>Live Pilots</span>
                    <span className="pilot-count-badge">{flightsData ? flightsData.length : 0}</span>
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

            <DialogContent style={{ padding: 0 }}>
                <TableContainer component={Paper} style={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell style={{ backgroundColor: '#121212', color: '#888', fontWeight: 600 }}>Callsign</TableCell>
                                <TableCell style={{ backgroundColor: '#121212', color: '#888', fontWeight: 600 }}>Username</TableCell>
                                <TableCell style={{ backgroundColor: '#121212', color: '#888', fontWeight: 600 }}>Aircraft</TableCell>
                                <TableCell style={{ backgroundColor: '#121212', color: '#888', fontWeight: 600 }}>Altitude</TableCell>
                                <TableCell style={{ backgroundColor: '#121212', color: '#888', fontWeight: 600 }}>Speed</TableCell>
                                <TableCell style={{ backgroundColor: '#121212', color: '#888', fontWeight: 600 }}>Heading</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredFlights.length > 0 ? (
                                filteredFlights.map((flight) => (
                                    <TableRow 
                                        key={flight.flightId} 
                                        onClick={() => onSelectFlight(flight)}
                                        sx={{ 
                                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'pointer' },
                                            transition: 'background-color 0.2s' 
                                        }}
                                    >
                                        <TableCell style={{ color: '#4dabf5', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{flight.callsign}</TableCell>
                                        <TableCell style={{ color: '#e0e0e0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{flight.username || "Anonymous"}</TableCell>
                                        <TableCell style={{ color: '#aaa', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{getAircraftName(flight.aircraftId)}</TableCell>
                                        <TableCell style={{ color: '#e0e0e0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{Math.round(flight.altitude).toLocaleString()} ft</TableCell>
                                        <TableCell style={{ color: '#e0e0e0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{Math.round(flight.speed)} kts</TableCell>
                                        <TableCell style={{ color: '#e0e0e0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{Math.round(flight.heading)}°</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" style={{ color: '#666', padding: '40px', borderBottom: 'none' }}>
                                        No pilots found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
        </Dialog>
    );
};

export default PilotsSidebar;
