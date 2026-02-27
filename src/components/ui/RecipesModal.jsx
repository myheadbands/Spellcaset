import { useGameStore } from '../../stores/gameStore.js';
import { getAllRecipeRows } from '../../engine/recipes.js';
import { ELEMENTS, SPELL_TYPE_COLORS } from '../../engine/elements.js';
import { SpellTooltip } from './SpellTooltip.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';

const FILTER_TABS = ['All', 'Damage', 'Heal', 'Buff', 'Debuff'];

export function RecipesModal() {
  const recipesOpen = useGameStore((s) => s.recipesModalOpen);
  const closeRecipes = useGameStore((s) => s.closeRecipes);

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => getAllRecipeRows(), []);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (filter !== 'All') {
      const type = filter.toLowerCase();
      list = list.filter((r) => r.spellType === type);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          (ELEMENTS[r.a]?.name ?? r.a).toLowerCase().includes(q) ||
          (ELEMENTS[r.b]?.name ?? r.b).toLowerCase().includes(q) ||
          (r.resultName ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, filter, search]);

  const elementName = (id) => ELEMENTS[id]?.name ?? id;

  const formatValue = (row) => {
    if (row.spellType === 'damage' && row.detail !== '-') return `${row.detail} dmg`;
    if (row.spellType === 'heal' && row.detail !== '-') return `${row.detail} heal`;
    if ((row.spellType === 'buff' || row.spellType === 'debuff') && row.detail !== '-') return row.detail;
    return row.detail;
  };

  const spellTypeColor = (type) => SPELL_TYPE_COLORS[type] ?? '#888';

  return (
    <AnimatePresence>
      {recipesOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recipes-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.target === e.currentTarget && closeRecipes()}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1a1428',
              borderRadius: 16,
              maxWidth: 700,
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <h2
                id="recipes-modal-title"
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#e8e0f0',
                  letterSpacing: '0.02em',
                }}
              >
                Recipe Book
              </h2>
              <button
                type="button"
                onClick={closeRecipes}
                aria-label="Close"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: 'none',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#c0b8d0',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = '#c0b8d0';
                }}
              >
                ×
              </button>
            </div>

            {/* Recipe count */}
            <div
              style={{
                padding: '8px 20px',
                fontSize: '0.875rem',
                color: '#a098b0',
              }}
            >
              {filteredRows.length} of {rows.length} recipes
            </div>

            {/* Filter tabs */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: '0 20px 12px',
                flexWrap: 'wrap',
              }}
            >
              {FILTER_TABS.map((tab) => {
                const isActive = filter === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilter(tab)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 20,
                      border: 'none',
                      background: isActive ? 'rgba(170,68,255,0.25)' : 'rgba(255,255,255,0.06)',
                      color: isActive ? '#e0c8ff' : '#a098b0',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = '#c0b8d0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = '#a098b0';
                      }
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div style={{ padding: '0 20px 12px' }}>
              <input
                type="text"
                placeholder="Search by element or result..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#e8e0f0',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(170,68,255,0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(170,68,255,0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Recipe list */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 20px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <AnimatePresence mode="popLayout">
                {filteredRows.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      color: '#706880',
                      fontSize: '0.9375rem',
                    }}
                  >
                    No recipes match your filters.
                  </motion.div>
                ) : (
                  filteredRows.map((row) => (
                    <motion.div
                      key={`${row.a}|${row.b}`}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                          fontSize: '0.9375rem',
                        }}
                      >
                        <span style={{ color: '#c8b8e0', fontWeight: 500 }}>{elementName(row.a)}</span>
                        <span style={{ color: '#706880', fontSize: '0.75rem' }}>+</span>
                        <span style={{ color: '#c8b8e0', fontWeight: 500 }}>{elementName(row.b)}</span>
                        <span style={{ color: '#706880', fontSize: '0.75rem' }}>→</span>
                        <SpellTooltip spellId={row.resultId}>
                          <span style={{ color: '#e8e0f0', fontWeight: 600, cursor: 'default' }}>{row.resultName}</span>
                        </SpellTooltip>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            background: `${spellTypeColor(row.spellType)}33`,
                            color: spellTypeColor(row.spellType),
                          }}
                        >
                          {row.spellType ?? 'damage'}
                        </span>
                        <span style={{ color: '#a098b0', fontSize: '0.8125rem' }}>
                          {formatValue(row)}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
