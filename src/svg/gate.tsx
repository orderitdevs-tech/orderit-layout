import React from "react";

type Props = React.SVGProps<SVGSVGElement> & {
    title?: string;
    size?: number | string;
};

// Entry Gate Icon
export const EntryGateIcon: React.FC<Props> = ({ title = "Entry Gate", size = 48, ...props }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label={title}
            {...props}
        >
            <title>{title}</title>
            <defs>
                <linearGradient id="doorGrad" x1="0" x2="1">
                    <stop offset="0" stopColor="#dcdcdc" />
                    <stop offset="1" stopColor="#a8a8a8" />
                </linearGradient>
                <linearGradient id="arrowGreen" x1="0" x2="1">
                    <stop offset="0" stopColor="#7cd67c" />
                    <stop offset="1" stopColor="#3d9b3d" />
                </linearGradient>
            </defs>

            {/* Door frame */}
            <rect x="14" y="10" width="36" height="44" rx="4" fill="url(#doorGrad)" stroke="#666" strokeWidth="1.5" />

            {/* Open space (inside gate) */}
            <rect x="20" y="16" width="24" height="32" rx="2" fill="#ffffff" />

            {/* Arrow pointing inward */}
            <path
                d="M26 32h12l-5-6m5 6l-5 6"
                stroke="url(#arrowGreen)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

// Exit Gate Icon
export const ExitGateIcon: React.FC<Props> = ({ title = "Exit Gate", size = 48, ...props }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label={title}
            {...props}
        >
            <title>{title}</title>
            <defs>
                <linearGradient id="doorGradExit" x1="0" x2="1">
                    <stop offset="0" stopColor="#dcdcdc" />
                    <stop offset="1" stopColor="#a8a8a8" />
                </linearGradient>
                <linearGradient id="arrowRed" x1="0" x2="1">
                    <stop offset="0" stopColor="#f28b82" />
                    <stop offset="1" stopColor="#d93025" />
                </linearGradient>
            </defs>

            {/* Door frame */}
            <rect x="14" y="10" width="36" height="44" rx="4" fill="url(#doorGradExit)" stroke="#666" strokeWidth="1.5" />

            {/* Open space (inside gate) */}
            <rect x="20" y="16" width="24" height="32" rx="2" fill="#ffffff" />

            {/* Arrow pointing outward */}
            <path
                d="M38 32H26l5-6m-5 6l5 6"
                stroke="url(#arrowRed)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
