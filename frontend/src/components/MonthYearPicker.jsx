import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

const MonthYearPicker = ({ value, onChange, className, placeholder, hasError, disabled }) => {
	// Estado interno para los selectores
	const [internalMonth, setInternalMonth] = useState('');
	const [internalYear, setInternalYear] = useState('');

	// Sincronizar con el valor externo cuando cambia
	useEffect(() => {
		if (value) {
			const [year, month] = value.split('-');
			setInternalMonth(month || '');
			setInternalYear(year || '');
		} else {
			setInternalMonth('');
			setInternalYear('');
		}
	}, [value]);

	const meses = [
		{ value: '01', label: 'Enero' },
		{ value: '02', label: 'Febrero' },
		{ value: '03', label: 'Marzo' },
		{ value: '04', label: 'Abril' },
		{ value: '05', label: 'Mayo' },
		{ value: '06', label: 'Junio' },
		{ value: '07', label: 'Julio' },
		{ value: '08', label: 'Agosto' },
		{ value: '09', label: 'Septiembre' },
		{ value: '10', label: 'Octubre' },
		{ value: '11', label: 'Noviembre' },
		{ value: '12', label: 'Diciembre' },
	];

	// Generar años (desde 1960 hasta año actual + 10)
	const currentYear = new Date().getFullYear();
	const years = [];
	for (let y = currentYear + 10; y >= 1960; y--) {
		years.push(y);
	}

	const handleMonthChange = (e) => {
		const newMonth = e.target.value;
		setInternalMonth(newMonth);
		
		// Solo notificar al padre si ambos campos están completos
		if (newMonth && internalYear) {
			onChange({ target: { value: `${internalYear}-${newMonth}` } });
		}
	};

	const handleYearChange = (e) => {
		const newYear = e.target.value;
		setInternalYear(newYear);
		
		// Solo notificar al padre si ambos campos están completos
		if (internalMonth && newYear) {
			onChange({ target: { value: `${newYear}-${internalMonth}` } });
		}
	};

	const baseSelectClass = `
		flex-1 px-3 py-2 pr-8 border-2 rounded-lg shadow-sm
		focus:outline-none focus:ring-2 focus:ring-green-500 
		transition-all duration-200 appearance-none cursor-pointer
		bg-white hover:border-green-300
		${hasError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'}
		${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
	`;

	return (
		<div className={`relative flex items-center gap-2 ${className || ''}`}>
			<div className="absolute left-3 pointer-events-none text-gray-400 z-10">
				<Calendar className="w-4 h-4" />
			</div>
			
			<select
				value={internalMonth}
				onChange={handleMonthChange}
				disabled={disabled}
				className={`${baseSelectClass} pl-10`}
				style={{
					backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
					backgroundPosition: 'right 0.5rem center',
					backgroundRepeat: 'no-repeat',
					backgroundSize: '1.5em 1.5em',
				}}
			>
				<option value="">Mes</option>
				{meses.map((mes) => (
					<option key={mes.value} value={mes.value}>
						{mes.label}
					</option>
				))}
			</select>

			<select
				value={internalYear}
				onChange={handleYearChange}
				disabled={disabled}
				className={baseSelectClass}
				style={{
					backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
					backgroundPosition: 'right 0.5rem center',
					backgroundRepeat: 'no-repeat',
					backgroundSize: '1.5em 1.5em',
				}}
			>
				<option value="">Año</option>
				{years.map((y) => (
					<option key={y} value={y}>
						{y}
					</option>
				))}
			</select>
		</div>
	);
};

export default MonthYearPicker;
