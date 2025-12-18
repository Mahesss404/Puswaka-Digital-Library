import React from 'react';
import { Button } from '@/components/ui/Buttons';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="max-w-md w-full text-center p-6">
        <Text size="lg" className="mb-4">Oops! Page Not Found.</Text>
        <Text className="mb-6">We couldn't find the page you were looking for.</Text>
        <Link to="/">
          <Button variant="default">Go Back Home</Button>
        </Link>
      </Card>
    </div>
  );
};

export default NotFound;
