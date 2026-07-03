import { useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { useGetInquiriesQuery, useRespondInquiryMutation } from '../../features/inquiries/inquiriesApi';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate, getInquiryStatusColor } from '../../utils';
import type { Inquiry } from '../../types';

export function AdminInquiries() {
  const { data: inquiries, isLoading } = useGetInquiriesQuery();
  const [respondInquiry, { isLoading: responding }] = useRespondInquiryMutation();

  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [responseText, setResponseText] = useState('');

  const handleRespond = async () => {
    if (!selected || !responseText.trim()) return;
    try {
      await respondInquiry({ id: selected.id, response: responseText }).unwrap();
      toast.success('Response sent');
      setSelected(null);
      setResponseText('');
    } catch {
      toast.error('Could not send response');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Inquiries</h1>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : !inquiries || inquiries.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">No inquiries yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Subject</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-700">{inq.user?.name ?? '—'}<br /><span className="text-xs text-gray-400">{inq.user?.email}</span></td>
                  <td className="px-6 py-4 font-medium text-gray-900">{inq.subject}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(inq.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getInquiryStatusColor(inq.status)}`}>
                      {inq.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => { setSelected(inq); setResponseText(inq.response ?? ''); }}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Respond
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Respond modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Respond to Inquiry</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">From {selected.user?.name} — {selected.subject}</p>
                <p className="text-sm text-gray-700">{selected.message}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your response</label>
                <textarea
                  rows={5}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response…"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRespond} isLoading={responding}>Send response</Button>
                <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
