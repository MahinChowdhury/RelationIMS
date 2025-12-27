
import FluidGlass from '../components/FluidGlass';

export default function Welcome() {
    return (
        <div className="w-full h-screen bg-background-light dark:bg-background-dark relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-10"></div>

            {/* Animated Gradient Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-green-400/20 dark:bg-green-600/20 blur-[120px] animate-pulse delay-1000"></div>
            <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-[100px] animate-pulse delay-700"></div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

            <div style={{ height: '100vh', position: 'relative', width: '100%' }}>
                <FluidGlass
                    mode="lens"
                    lensProps={{
                        scale: 0.25,
                        ior: 1.15,
                        thickness: 1.5, // Reduced for more transparency
                        roughness: 0,
                        transmission: 1.0,
                        chromaticAberration: 0.05,
                        anisotropy: 0.1,
                        // Customizing transmission material properties if needed to match greenish theme
                        color: '#ffffff', // Whiter base for less tint
                        attenuationColor: '#e0ffe8', // Very subtle tint
                        attenuationDistance: 2.0 // Increased distance so color is less intense
                    }}
                />
            </div>

            {/* Absolute overlay for top left logo if typically present, but NavItems handle nav */}
            <div className="absolute top-6 left-6 z-50 pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">eco</span>
                    </div>
                    <span className="text-xl font-bold text-text-main dark:text-white">EcoWear</span>
                </div>
            </div>
        </div>
    );
}
