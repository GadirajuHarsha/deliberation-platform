import React from 'react';

/**
 * Global footer for the platform.
 * Contains the UT Austin attribution as requested by the user.
 */
export default function Footer() {
        return (
                <footer className="bg-white border-t border-surface-200 mt-auto">
                        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                                <p className="text-center text-sm text-surface-500">
                                        &copy; 2026. Developed at The University of Texas at Austin.
                                </p>
                        </div>
                </footer>
        );
}
