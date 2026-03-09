interface QuantityInputProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    className?: string;
    inputClassName?: string;
    disabled?: boolean;
    step?: number;
}

export function QuantityInput({
    value,
    onChange,
    min = 0,
    max,
    className = '',
    inputClassName = '',
    disabled = false,
    step = 1
}: QuantityInputProps) {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '') {
            onChange(min);
            return;
        }
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
            let clamped = num;
            if (min !== undefined && clamped < min) clamped = min;
            if (max !== undefined && clamped > max) clamped = max;
            onChange(clamped);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newValue = value + step;
            if (max !== undefined && newValue > max) return;
            onChange(newValue);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newValue = value - step;
            if (newValue < min) return;
            onChange(newValue);
        }
    };

    return (
        <input
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            className={`w-full text-center py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17cf54] focus:border-[#17cf54] font-bold ${inputClassName} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        />
    );
}
