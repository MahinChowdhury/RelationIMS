import React from 'react';
import Barcode from 'react-barcode';

interface BarcodeItem {
    code: string;
    itemDetails: string; // e.g., "Color: Red, Size: L"
}

interface BarcodeSheetProps {
    items: BarcodeItem[];
}

export const BarcodeSheet: React.FC<BarcodeSheetProps> = ({ items }) => {
    return (
        <div className="barcode-sheet w-full bg-white text-black p-4">
            <style>
                {`
                /* ---------- SCREEN STYLES ---------- */

                .barcode-wrapper {
                    transform: scale(0.9);
                    transform-origin: center;
                }

                @media (max-width: 640px) {
                    .barcode-wrapper {
                        transform: scale(0.75);
                    }
                }

                /* ---------- PRINT STYLES ---------- */

                @media print {
                    @page {
                        margin: 1cm;
                        size: auto;
                    }

                    body * {
                        visibility: hidden;
                    }

                    .barcode-sheet,
                    .barcode-sheet * {
                        visibility: visible;
                    }

                    .barcode-sheet {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .barcode-wrapper {
                        transform: scale(1);
                    }
                }
                `}
            </style>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item, index) => (
                    <div
                        key={`${item.code}-${index}`}
                        className="flex flex-col items-center justify-center
                                   border border-gray-200 p-2 rounded-md
                                   break-inside-avoid w-full overflow-hidden"
                    >
                        <div className="barcode-wrapper">
                            <Barcode
                                value={item.code}
                                height={40}
                                fontSize={12}
                                width={1.5}
                                margin={0}
                            />
                        </div>

                        <div className="text-[10px] mt-1 text-center font-mono leading-tight">
                            {item.itemDetails}
                        </div>
                    </div>
                ))}
            </div>

            {items.length === 0 && (
                <div className="text-center p-10 text-gray-500">
                    No items to print
                </div>
            )}
        </div>
    );
};
