import React from 'react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="max-w-md w-full text-center p-6">
        <p className="text-lg font-semibold mb-4">Oops! Page Not Found.</p>
        <p className="mb-6">We couldn't find the page you were looking for.</p>
        <Link to="/">
          <Button variant="default">Go Back Home</Button>
        </Link>
      </Card>
    </div>
  );
};

export default NotFound;
