import RegistrationForm from "@/components/features/RegistrationForm";
import { EVENTO_INFO } from "@/lib/constants";

export default function HomePage() {
    return (
        <main className="min-h-screen flex flex-col items-center bg-gray-50 text-gray-900">
            {/* Hero Section */}
            <div className="w-full bg-primary text-white py-12 px-4 shadow-lg text-center">
                <h1 className="text-4xl font-extrabold mb-2 uppercase tracking-wide">
                    {EVENTO_INFO.motivo}
                </h1>
                <p className="text-xl font-medium opacity-90">
                    Convoca: {EVENTO_INFO.convoca}
                </p>
                <div className="mt-6 flex flex-col md:flex-row justify-center gap-4 md:gap-8 text-sm md:text-base font-semibold">
                    <span className="bg-white/10 px-3 py-1 rounded backdrop-blur-sm">
                        📅 {EVENTO_INFO.fecha} - {EVENTO_INFO.hora}
                    </span>
                    <span className="bg-white/10 px-3 py-1 rounded backdrop-blur-sm">
                        📍 {EVENTO_INFO.lugar}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 w-full max-w-md p-4 -mt-6">
                <RegistrationForm />
            </div>

            {/* Footer support */}
            <footer className="w-full py-6 text-center text-gray-500 text-sm">
                <p>© 2026 {EVENTO_INFO.convoca}</p>
            </footer>
        </main>
    );
}
