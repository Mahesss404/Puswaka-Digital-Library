import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Route mapping configuration
const routeConfig = {
    '/home': { label: 'Home', parent: null },
    '/book': { label: 'Book Detail', parent: '/home' },
    // '/book/:id': { label: 'Book Detail', parent: '/catalog' },
    '/profile': { label: 'Profile', parent: '/home' },
    '/history': { label: 'History', parent: '/home' },
    '/notification': { label: 'Notifications', parent: '/home' },
};

/**
 * DynamicBreadcrumb component
 * Automatically generates breadcrumbs based on current route
 * 
 * @param {Object} props
 * @param {string} props.currentPageLabel - Optional custom label for current page
 * @param {string} props.className - Optional additional classes
 */
const DynamicBreadcrumb = ({ currentPageLabel, className = '' }) => {
    const location = useLocation();
    const pathname = location.pathname;

    // Build breadcrumb trail
    const buildBreadcrumbTrail = () => {
        const trail = [];
        
        // Get the base path (e.g., /book/:id -> /book)
        let basePath = pathname;
        const pathSegments = pathname.split('/').filter(Boolean);
        
        // For dynamic routes like /book/:id or /notification/:id
        if (pathSegments.length > 1) {
            basePath = '/' + pathSegments[0];
        }

        // Find route config
        let currentPath = basePath;
        let config = routeConfig[currentPath];

        // If no exact match, check if it's a child route
        if (!config && pathSegments.length > 1) {
            // For routes like /notification/:id, use the parent route config
            currentPath = '/' + pathSegments[0];
            config = routeConfig[currentPath];
        }

        // Build trail from current to root
        const pathChain = [];
        let current = currentPath;
        
        while (current && routeConfig[current]) {
            pathChain.unshift(current);
            current = routeConfig[current].parent;
        }

        // Add Home if not already present
        if (pathChain[0] !== '/home') {
            pathChain.unshift('/home');
        }

        // Convert to trail items
        pathChain.forEach((path, index) => {
            const routeInfo = routeConfig[path];
            const isLast = index === pathChain.length - 1;
            
            // Determine if this is the current page
            const isCurrentPage = isLast && !currentPageLabel;

            trail.push({
                path,
                label: routeInfo.label,
                isCurrentPage,
                isClickable: !isCurrentPage
            });
        });

        // Add custom current page label if provided (for dynamic routes)
        if (currentPageLabel) {
            trail.push({
                path: pathname,
                label: currentPageLabel,
                isCurrentPage: true,
                isClickable: false
            });
        }

        return trail;
    };

    const breadcrumbTrail = buildBreadcrumbTrail();

    return (
        <Breadcrumb className={className}>
            <BreadcrumbList>
                {breadcrumbTrail.map((item, index) => (
                    <React.Fragment key={item.path}>
                        <BreadcrumbItem>
                            {item.isClickable ? (
                                <BreadcrumbLink asChild>
                                    <Link to={item.path} className="text-primary hover:text-primary/80">
                                        {item.label}
                                    </Link>
                                </BreadcrumbLink>
                            ) : (
                                <BreadcrumbPage>{item.label}</BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                        {index < breadcrumbTrail.length - 1 && (
                            <BreadcrumbSeparator className="text-gray-400">/</BreadcrumbSeparator>
                        )}
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
};

export default DynamicBreadcrumb;
