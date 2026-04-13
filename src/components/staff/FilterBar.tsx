'use client';

export interface FilterState {
  role: string;
  availability: string;
  experience: string;
  salary: string;
}

export const initialFilters: FilterState = {
  role: 'all',
  availability: 'all',
  experience: 'all',
  salary: 'all',
};

export function FilterBar({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
}) {
  return (
    <div className="filters-card">
      <div className="filter-dropdowns">
        <select
          className="filter-dropdown"
          value={filters.role}
          onChange={(e) => onChange({ role: e.target.value })}
        >
          <option value="all">All Staff</option>
          <option value="chef">Cooks &amp; Chefs</option>
          <option value="bartender">Bartenders</option>
          <option value="captain">Waiters &amp; Servers</option>
          <option value="helper">Kitchen Helpers</option>
          <option value="runner">Food Runners</option>
          <option value="support">Support Staff</option>
        </select>
        <select
          className="filter-dropdown"
          value={filters.availability}
          onChange={(e) => onChange({ availability: e.target.value })}
        >
          <option value="all">Any Availability</option>
          <option value="now">Available Now</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <select
          className="filter-dropdown"
          value={filters.experience}
          onChange={(e) => onChange({ experience: e.target.value })}
        >
          <option value="all">All Experience</option>
          <option value="0-3">0 - 3 years</option>
          <option value="3-7">3 - 7 years</option>
          <option value="7+">7+ years</option>
        </select>
        <select
          className="filter-dropdown"
          value={filters.salary}
          onChange={(e) => onChange({ salary: e.target.value })}
        >
          <option value="all">All Salary</option>
          <option value="0-20">Under ₹20K</option>
          <option value="20-35">₹20K - ₹35K</option>
          <option value="35+">₹35K+</option>
        </select>
      </div>
      <style>{`
        .filters-card { background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 24px; }
        .filter-dropdowns { display: flex; gap: 10px; flex-wrap: wrap; }
        .filter-dropdown { flex: 1; min-width: 160px; padding: 14px 18px; border-radius: var(--radius-md); border: 1.5px solid var(--sand); background: var(--cream); font-size: 14px; font-weight: 600; font-family: var(--font-body); color: var(--charcoal); cursor: pointer; appearance: none; padding-right: 44px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23444' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 18px center; }
        .filter-dropdown:focus { outline: none; border-color: var(--ember); }
        @media (max-width: 640px) { .filter-dropdowns { flex-direction: column; } .filter-dropdown { min-width: 0; } }
      `}</style>
    </div>
  );
}
