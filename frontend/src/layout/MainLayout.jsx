import Navbar from '../components/Navbar';

/**
 * MainLayout — wraps every public page with the shared Navbar.
 * Dashboard pages have their own internal layout & sidebar, so they skip this.
 */
export default function MainLayout({ children }) {
    return (
        <>
            <Navbar />
            <main className="app-main">
                {children}
            </main>
        </>
    );
}
