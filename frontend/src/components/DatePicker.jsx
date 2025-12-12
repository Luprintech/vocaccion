import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

const DatePicker = ({ value, onChange, className, placeholder, hasError, disabled, name }) => {
	// Estado interno para los selectores
	const [internalDay, setInternalDay] = useState('');
	const [internalMonth, setInternalMonth] = useState('');
	const [internalYear, setInternalYear] = useState('');

	// Sincronizar con el valor externo cuando cambia
	useEffect(() => {
		if (value) {
			const [year, month, day] = value.split('-');
			setInternalDay(day || '');
			setInternalMonth(month || '');
			setInternalYear(year || '');
		} else {
			setInternalDay('');
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

	// Generar días (1-31)
	const dias = [];
	for (let d = 1; d <= 31; d++) {
		dias.push(d.toString().padStart(2, '0'));
	}

	// Generar años (desde 1900 hasta año actual)
	const currentYear = new Date().getFullYear();
	const years = [];
	for (let y = currentYear; y >= 1900; y--) {
		years.push(y);
	}

	const handleDayChange = (e) => {
		const newDay = e.target.value;
		setInternalDay(newDay);
		
		// Solo notificar al padre si todos los campos están completos
		if (newDay && internalMonth && internalYear) {
			onChange({ target: { value: `${internalYear}-${internalMonth}-${newDay}`, name } });
		}
	};

	const handleMonthChange = (e) => {
		const newMonth = e.target.value;
		setInternalMonth(newMonth);
		
		// Solo notificar al padre si todos los campos están completos
		if (internalDay && newMonth && internalYear) {
			onChange({ target: { value: `${internalYear}-${newMonth}-${internalDay}`, name } });
		}
	};

	const handleYearChange = (e) => {
		const newYear = e.target.value;
		setInternalYear(newYear);
		
		// Solo notificar al padre si todos los campos están completos
		if (internalDay && internalMonth && newYear) {
			onChange({ target: { value: `${newYear}-${internalMonth}-${internalDay}`, name } });
		}
	};

	const baseSelectClass = `
		flex-1 px-3 py-2 pr-8 border-2 rounded-lg shadow-sm
		focus:outline-none focus:ring-2 focus:ring-purple-500 
		transition-all duration-200 appearance-none cursor-pointer
		bg-white hover:border-purple-300
		${hasError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'}
		${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
	`;

	return (
		<div className={`relative flex items-center gap-2 ${className || ''}`}>
			<div className="absolute left-3 pointer-events-none text-gray-400 z-10">
				<Calendar className="w-4 h-4" />
			</div>
			
			<select
				value={internalDay}
				onChange={handleDayChange}
				disabled={disabled}
				className={`${baseSelectClass} pl-10 flex-[0.7]`}
				style={{
					backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
					backgroundPosition: 'right 0.5rem center',
					backgroundRepeat: 'no-repeat',
					backgroundSize: '1.5em 1.5em',
				}}
			>
				<option value="">Día</option>
				{dias.map((d) => (
					<option key={d} value={d}>
						{parseInt(d)}
					</option>
				))}
			</select>

			<select
				value={internalMonth}
				onChange={handleMonthChange}
				disabled={disabled}
				className={`${baseSelectClass} flex-[1.2]`}
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
				className={`${baseSelectClass} flex-[0.9]`}
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

export default DatePicker;
