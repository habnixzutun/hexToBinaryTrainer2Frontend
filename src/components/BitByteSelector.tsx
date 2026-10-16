import { motion } from 'framer-motion';

interface Props {
    options: number[];
    value: number;
    onChange: (v: number) => void;
    label: string;
    singularLabel: string;
}

export default function BitByteSelector({ options, value, onChange, label, singularLabel }: Props) {
    return (
        <div className="mt-2">
            <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-widest text-on-surface-faint">
                {label}
            </p>
            <div className="flex items-center gap-1 px-2">
                {options.map((b) => (
                    <motion.button
                        key={b}
                        onClick={() => onChange(b)}
                        whileTap={{ scale: 0.95 }}
                        aria-label={`${b} ${b === 1 && singularLabel ? singularLabel : label}`}
                        aria-pressed={value === b}
                        className={`flex-1 h-8 rounded text-xs font-semibold transition-colors ${
                            value === b
                                ? 'bg-emerald-800 text-emerald-100'
                                : 'bg-surface-alt text-on-surface-faint hover:text-on-surface-dim'
                        }`}
                    >
                        {b}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
