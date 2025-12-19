import { Text } from '@/components/ui/text';
import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, AlertCircle } from 'lucide-react';
import { calculateOverdueFine } from './Notification';

const NotificationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get notification data passed from the list view
    const notification = location.state?.notification;

    if (!notification) {
        return (
            <div className="p-8 flex flex-col items-center justify-center">
                 <Text size="lg">Notification not found or session expired.</Text>
                 <button onClick={() => navigate('/notification')} className="mt-4 text-blue-600 hover:underline">
                     Back to List
                 </button>
            </div>
        );
    }

    // Calculate fine purely for display logic if not already passed (though we passed it in some cases)
    // For consistency, if it's an Alert type, we might want to recalculate or just show what's there.
    // simpler: If it's an Overdue Alert, we show the fine.
    
    // Re-calculate strictly if overdue and not returned
    const showFine = notification.type === 'overdue_alert';
    
    // Calculate logic explicitly to get days
    let fineAmount = 0;
    let overdueDays = 0;

    if (showFine) {
        const due = new Date(notification.originalData.dueDate);
        const now = new Date(); // Or notification.date if we want historical snapshot, but usually fine changes daily. Lets use NOW for current fine status? Or snapshot? 
        // User asked for "denda alert", the notification is an ALERT.
        // Usually an alert is a snapshot in time. But "how much should be pay" implies current status. 
        // Let's stick to the notification date (snapshot) OR current date. 
        // Given it's a notification from the past, the fine might have increased. 
        // However, usually "Denda details" implies what they owe. 
        // I will use "now" if it's still not returned.
        
        const returnDate = notification.originalData.returnDate ? new Date(notification.originalData.returnDate) : new Date();
        
        due.setHours(0,0,0,0);
        returnDate.setHours(0,0,0,0);

        if (returnDate > due) {
            const diffTime = Math.abs(returnDate - due);
            overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            fineAmount = overdueDays * 1000;
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white min-h-screen">
            <button 
                onClick={() => navigate(-1)} 
                className="group mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> 
                Back to Notifications
            </button>

            <div className="space-y-6">
                <div className="border-b pb-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <Text size="2xl" className="font-bold text-gray-900 leading-tight break-words">
                            {notification.title}
                        </Text>
                        <span className="flex items-center text-sm text-gray-500 shrink-0 mt-2 md:mt-0">
                            <Calendar className="w-4 h-4 mr-2 shrink-0" />
                            {new Date(notification.date).toLocaleString('id-ID', {
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                </div>

                {showFine && fineAmount > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                            <Text size="lg" className="font-semibold text-red-800">Denda Keterlambatan: Rp{fineAmount.toLocaleString()}</Text>
                            <p className="text-sm text-red-700 mt-1">
                                Buku ini telah melewati tanggal pengembalian ({new Date(notification.originalData.dueDate).toLocaleDateString('id-ID')}). 
                                Harap segera lunasi denda di perpustakaan.
                            </p>
                        </div>
                    </div>
                )}

                <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                    <Text className="mb-4">{notification.content}</Text>
                    
                    {/* Additional Details (Optional) */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1">
                        <p><strong>Book Title:</strong> {notification.originalData.bookTitle}</p>
                        <p><strong>Status:</strong> {notification.originalData.returnDate ? 'Returned' : 'Borrowed (Active)'}</p>
                        <p><strong>Due Date:</strong> {new Date(notification.originalData.dueDate).toLocaleDateString('id-ID')}</p>
                        
                        {showFine && overdueDays > 0 && (
                            <>
                                <div className="my-2 border-t border-gray-200"></div>
                                <p className="text-red-700"><strong>Tax Details (Denda):</strong></p>
                                <p><strong>Days Overdue:</strong> {overdueDays} days</p>
                                <p><strong>Fine Rate:</strong> Rp 1.000 / day</p>
                                <p><strong>Total Fine:</strong> <span className="font-bold text-red-600">Rp {fineAmount.toLocaleString()}</span></p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationDetails;
