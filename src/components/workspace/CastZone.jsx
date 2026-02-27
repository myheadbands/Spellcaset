import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CastZone = forwardRef(({ active }, ref) => (
  <div ref={ref} className={`cast-zone${active ? ' active' : ''}`}>
    <AnimatePresence>
      {active && (
        <motion.div
          className="cast-zone-ring"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </AnimatePresence>
    <span className="cast-zone-text">{active ? 'Release to Cast' : 'Drop Here To Cast'}</span>
  </div>
));

CastZone.displayName = 'CastZone';
export default CastZone;
