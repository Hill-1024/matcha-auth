type IconProps = {
    className?: string;
};

export const AppLogoIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M12 8a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1m9 3c0 5.55-3.84 10.74-9 12c-5.16-1.26-9-6.45-9-12V5l9-4l9 4zm-9-5a3 3 0 0 0-3 3c0 1.31.83 2.42 2 2.83V18h2v-2h2v-2h-2v-2.17c1.17-.41 2-1.52 2-2.83a3 3 0 0 0-3-3"/>
    </svg>
);

export const KeyIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M12.65 10C11.83 7.67 9.61 6 7 6C3.69 6 1 8.69 1 12C1 15.31 3.69 18 7 18C9.61 18 11.83 16.33 12.65 14H17V10H12.65M7 14C5.9 14 5 13.1 5 12C5 10.9 5.9 10 7 10C8.1 10 9 10.9 9 12C9 13.1 8.1 14 7 14ZM21 10L12.65 18.35L14.65 20.35L16.65 18.35L18.65 20.35L21 18V10Z"/>
    </svg>
);

export const MoreVertIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>
);

export const EditIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
);

export const SettingsIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L3.16 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.04.64.09.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>
);

export const SearchIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
);

export const CloseIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"/>
    </svg>
);

export const DeleteIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
);
export const SearchOffIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="m19.479 20.9l-6.894-6.894h-1q-.57 1.35-1.81 2.172T7 17q-2.077 0-3.538-1.461T2 12q0-1.746 1.072-3.083q1.072-1.336 2.73-1.694L3.1 4.521q-.16-.16-.16-.35q0-.192.16-.358q.166-.146.357-.155t.357.156l16.373 16.378q.14.14.153.342q.012.2-.153.366q-.16.16-.354.16t-.354-.16m2.928-8.602q-.053.137-.184.268l-2.117 2.098q-.131.13-.26.186t-.255.056q-.2 0-.302-.038t-.233-.118l-1.46-1.248l-.73.539l-.385-.385l1.423-1.021l1.627 1.215L21.387 12l-1-1h-6.562l-1-1h7.635q.161 0 .3.056q.14.056.27.186l1.193 1.192q.13.132.184.268q.053.137.053.298t-.053.298M7 16q1.275 0 2.349-.764q1.074-.765 1.467-2.115h.884l-1.342-1.342l-1.184-1.184l-1.183-1.184L6.648 8.07q-1.657.104-2.653 1.303Q3 10.572 3 12q0 1.65 1.175 2.825T7 16m-.874-3.126q-.357-.357-.357-.874t.357-.874t.874-.357t.874.357t.357.874t-.357.874t-.874.357t-.874-.357"/>
    </svg>
);

export const AddIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
);

export const KeyboardIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M3 20q-.825 0-1.412-.587T1 18V6q0-.825.588-1.412T3 4h18q.825 0 1.413.588T23 6v12q0 .825-.587 1.413T21 20zm0-2h18V6H3zm5-1h8v-2H8zm-3-3.5h2v-2H5zm4 0h2v-2H9zm4 0h2v-2h-2zm4 0h2v-2h-2zM5 10h2V8H5zm4 0h2V8H9zm4 0h2V8h-2zm4 0h2V8h-2zM3 18V6z"/>
    </svg>
);

export const ArrowBackIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    </svg>
);

export const LightModeIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
    </svg>
);

export const DarkModeIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
    </svg>
);
export const MoreHorizIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>
);

export const CheckIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
);

export const TuneIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
    </svg>
);

export const PaletteIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </svg>
);
export const ForumIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
    </svg>
);

export const CodeIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
    </svg>
);

export const CloudQueueIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
    </svg>
);

export const SmartphoneIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
    </svg>
);

export const QrCodeScannerIcon = ({className}: IconProps) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path
                d="M6 4h2v1H6a2 2 0 0 0-2 2v2H3V7a3 3 0 0 1 3-3M4 18a2 2 0 0 0 2 2h2v1H6a3 3 0 0 1-3-3v-2h1zM17 4a3 3 0 0 1 3 3v2h-1V7a2 2 0 0 0-2-2h-2V4zm3 14a3 3 0 0 1-3 3h-2v-1h2a2 2 0 0 0 2-2v-2h1z"/>
        </svg>
    )
;

export const InfoIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>
);

export const ExportIcon = ({className}: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path
            d="M11.5 9a1 1 0 1 0 0-2H9V5.207C9 3.87 7.384 3.2 6.44 4.147L1.644 8.938a1.5 1.5 0 0 0 0 2.122l4.794 4.793c.945.945 2.56.275 2.56-1.061V13H16a1 1 0 0 0 1-1v-1.587L20.586 14L17 17.586V16a1 1 0 0 0-1-1h-3.5a1 1 0 1 0 0 2H15v1.793c0 1.336 1.615 2.005 2.56 1.06l4.794-4.793a1.5 1.5 0 0 0 0-2.121L17.56 8.146C16.615 7.2 15 7.87 15 9.206V11H8a1 1 0 0 0-1 1v1.586L3.413 10L7 6.414V8a1 1 0 0 0 1 1z"/>
    </svg>
);