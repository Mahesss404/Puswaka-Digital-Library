import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertCircle, BookOpen, CreditCard, ArrowLeft, CheckCircle, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DynamicBreadcrumb from '@/components/DynamicBreadcrumb';

const OverduePayment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Notification & borrow data passed from NotificationDetails
    const notification = location.state?.notification;

    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle | loading | success | pending | error
    const [errorMessage, setErrorMessage] = useState('');
    const [snapLoaded, setSnapLoaded] = useState(false);

    // ─── Derived data from notification ───────────────────────────────────────
    const borrowData = notification?.originalData;
    const borrowId = borrowData?.id;
    const bookTitle = borrowData?.bookTitle || 'Unknown Book';

    // Calculate days overdue & fine amount
    const dueDate = borrowData?.dueDate ? new Date(borrowData.dueDate) : null;
    const now = new Date();
    let overdueDays = 0;
    let fineAmount = 0;

    if (dueDate) {
        const due = new Date(dueDate);
        const returned = new Date(now);
        due.setHours(0, 0, 0, 0);
        returned.setHours(0, 0, 0, 0);
        if (returned > due) {
            const diffTime = Math.abs(returned - due);
            overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            fineAmount = overdueDays * 1000;
        }
    }

    // ─── Load Midtrans Snap.js dynamically ────────────────────────────────────
    useEffect(() => {
        const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
        const snapUrl = import.meta.env.VITE_MIDTRANS_SNAP_URL;

        if (!clientKey || clientKey.includes('XXXX')) {
            console.warn('Midtrans Client Key belum dikonfigurasi di .env');
        }

        const existingScript = document.getElementById('midtrans-snap-script');
        if (existingScript) {
            setSnapLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.id = 'midtrans-snap-script';
        script.src = snapUrl || 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', clientKey || '');
        script.async = true;
        script.onload = () => setSnapLoaded(true);
        script.onerror = () => {
            console.error('Gagal memuat Midtrans Snap.js');
            setSnapLoaded(false);
        };
        document.head.appendChild(script);

        return () => {
            // Don't remove - keeps it cached for subsequent visits
        };
    }, []);

    // ─── Handle Payment ───────────────────────────────────────────────────────
    const handlePayment = async () => {
        if (!snapLoaded) {
            setErrorMessage('Midtrans Snap belum siap. Coba beberapa saat lagi.');
            return;
        }
        if (!borrowId) {
            setErrorMessage('Data transaksi tidak ditemukan. Kembali dan coba lagi.');
            return;
        }
        if (fineAmount <= 0) {
            setErrorMessage('Jumlah denda tidak valid.');
            return;
        }

        setPaymentStatus('loading');
        setErrorMessage('');

        // Unique order ID for this fine payment
        const orderId = `FINE-${borrowId}-${Date.now()}`;

        try {
            // ── Step 1: Request snap token via Vite Proxy → Midtrans Sandbox ──
            const response = await fetch('/midtrans-api/snap/v1/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction_details: {
                        order_id: orderId,
                        gross_amount: fineAmount,
                    },
                    item_details: [
                        {
                            id: `FINE-${borrowId}`,
                            price: fineAmount,
                            quantity: 1,
                            name: `Denda Keterlambatan: ${bookTitle}`,
                        },
                    ],
                    customer_details: {
                        first_name: borrowData?.userName || 'Peminjam',
                        email: borrowData?.userContact?.includes('@')
                            ? borrowData.userContact
                            : 'noreply@puswaka.app',
                        phone: !borrowData?.userContact?.includes('@')
                            ? borrowData?.userContact || ''
                            : '',
                    },
                    credit_card: { secure: true },
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData?.error_messages?.[0] || `HTTP ${response.status}`);
            }

            const data = await response.json();
            const snapToken = data.token;

            if (!snapToken) {
                throw new Error('Snap token tidak diterima dari Midtrans.');
            }

            // ── Step 2: Open Midtrans Snap popup ──────────────────────────────
            setPaymentStatus('idle'); // Reset so Snap can take over
            window.snap.pay(snapToken, {

                // ── SUCCESS: update Firestore, navigate back ─────────────────
                onSuccess: async (result) => {
                    try {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(0, 0, 0, 0);

                        await updateDoc(doc(db, 'borrows', borrowId), {
                            status: 'borrowed',                       // tetap active
                            dueDate: Timestamp.fromDate(tomorrow),    // deadline = besok
                            fineStatus: 'paid',
                            finePaidAt: serverTimestamp(),
                            finePaidAmount: fineAmount,
                            paymentOrderId: result.order_id || orderId,
                        });

                        setPaymentStatus('success');
                    } catch (firestoreErr) {
                        console.error('Gagal update Firestore setelah pembayaran:', firestoreErr);
                        // Payment berhasil di Midtrans tapi Firestore gagal - catat order ID
                        setPaymentStatus('success'); // Tetap tampil sukses karena uang sudah terbayar
                    }
                },

                // ── PENDING: catat order ID di Firestore, tampil info pending ─
                onPending: async (result) => {
                    try {
                        await updateDoc(doc(db, 'borrows', borrowId), {
                            fineStatus: 'pending',
                            paymentOrderId: result.order_id || orderId,
                        });
                    } catch (err) {
                        console.error('Gagal update pending status:', err);
                    }
                    setPaymentStatus('pending');
                },

                // ── ERROR: TIDAK ada perubahan Firestore, tampil pesan error ──
                onError: (result) => {
                    console.error('Midtrans payment error:', result);
                    setPaymentStatus('error');
                    setErrorMessage('Pembayaran gagal. Silakan coba lagi.');
                },

                // ── CLOSE (popup ditutup user tanpa bayar) ───────────────────
                onClose: () => {
                    if (paymentStatus === 'loading') {
                        setPaymentStatus('idle');
                    }
                },
            });

        } catch (err) {
            console.error('handlePayment error:', err);
            setPaymentStatus('error');
            setErrorMessage(err.message || 'Terjadi kesalahan. Coba lagi.');
        }
    };

    // ─── Guard: no notification data ─────────────────────────────────────────
    if (!notification || !borrowData) {
        return (
            <div className="min-h-screen mt-16 flex flex-col items-center justify-center px-4">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <p className="text-gray-600 text-center mb-4">
                    Data notifikasi tidak ditemukan atau sesi telah berakhir.
                </p>
                <button
                    onClick={() => navigate('/notification')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Notifikasi
                </button>
            </div>
        );
    }

    // ─── SUCCESS STATE ────────────────────────────────────────────────────────
    if (paymentStatus === 'success') {
        return (
            <div className="min-h-screen mt-16 flex flex-col items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
                        <p className="text-gray-600 text-sm mb-1">
                            Denda sebesar{' '}
                            <span className="font-semibold text-emerald-700">
                                Rp {fineAmount.toLocaleString('id-ID')}
                            </span>{' '}
                            telah dibayar.
                        </p>
                        <p className="text-gray-500 text-sm mb-6">
                            Status buku <span className="font-semibold">{bookTitle}</span> kembali aktif.
                            Deadline diperpanjang hingga{' '}
                            <span className="font-semibold text-blue-600">
                                {new Date(Date.now() + 86400000).toLocaleDateString('id-ID', {
                                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                })}
                            </span>
                            . Harap segera kembalikan buku ke perpustakaan.
                        </p>
                        <button
                            onClick={() => navigate('/notification')}
                            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                        >
                            Kembali ke Notifikasi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── PENDING STATE ────────────────────────────────────────────────────────
    if (paymentStatus === 'pending') {
        return (
            <div className="min-h-screen mt-16 flex flex-col items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-8 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-10 h-10 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Menunggu Konfirmasi</h2>
                        <p className="text-gray-600 text-sm mb-6">
                            Pembayaran sedang diproses. Status akan diperbarui otomatis setelah
                            konfirmasi dari bank diterima. Kamu tidak perlu melakukan apa-apa.
                        </p>
                        <button
                            onClick={() => navigate('/notification')}
                            className="w-full py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium transition-colors"
                        >
                            Kembali ke Notifikasi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── MAIN PAYMENT UI ──────────────────────────────────────────────────────
    return (
        <div className="min-h-screen mt-16 pb-10">
            <div className="mx-auto w-full max-w-screen-sm px-4">
                <div className="p-4">
                    <DynamicBreadcrumb currentPageLabel="Bayar Denda" />
                </div>

                {/* Fine Summary Card */}
                <Card className="mb-4 border-red-100 bg-red-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-red-800 text-base">
                            <AlertCircle className="w-5 h-5" />
                            Ringkasan Denda Keterlambatan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-red-100">
                            <BookOpen className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">{bookTitle}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Jatuh tempo:{' '}
                                    {dueDate
                                        ? dueDate.toLocaleDateString('id-ID', {
                                              weekday: 'long', day: 'numeric',
                                              month: 'long', year: 'numeric',
                                          })
                                        : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white rounded-lg border border-red-100 text-center">
                                <p className="text-2xl font-bold text-red-600">{overdueDays}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Hari Terlambat</p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-red-100 text-center">
                                <p className="text-xs text-gray-500 mb-0.5">Tarif Denda</p>
                                <p className="text-sm font-medium text-gray-700">Rp 1.000 / hari</p>
                            </div>
                        </div>

                        <div className="p-4 bg-red-600 rounded-xl text-white text-center">
                            <p className="text-xs opacity-80 mb-1">Total Denda yang Harus Dibayar</p>
                            <p className="text-3xl font-bold tracking-tight">
                                Rp {fineAmount.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Info: After Payment */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-700">
                        <span className="font-semibold">Setelah pembayaran berhasil:</span> Status buku
                        kembali <span className="font-semibold">Active</span> dan deadline diperpanjang
                        hingga <span className="font-semibold">besok</span>. Harap segera kembalikan
                        buku ke perpustakaan.
                    </p>
                </div>

                {/* Error Message */}
                {paymentStatus === 'error' && errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handlePayment}
                        disabled={paymentStatus === 'loading' || !snapLoaded || fineAmount <= 0}
                        className={`
                            w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2
                            transition-all duration-200
                            ${paymentStatus === 'loading'
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md hover:shadow-lg'}
                            disabled:opacity-60 disabled:cursor-not-allowed
                        `}
                    >
                        {paymentStatus === 'loading' ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Memproses...
                            </>
                        ) : paymentStatus === 'error' ? (
                            <>
                                <RefreshCw className="w-5 h-5" />
                                Coba Lagi
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5" />
                                Bayar Denda Rp {fineAmount.toLocaleString('id-ID')}
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </button>
                </div>

                {!snapLoaded && (
                    <p className="text-center text-xs text-gray-400 mt-3">
                        Memuat sistem pembayaran...
                    </p>
                )}
            </div>
        </div>
    );
};

export default OverduePayment;
