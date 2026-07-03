import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useCreateInquiryMutation } from '../features/inquiries/inquiriesApi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const schema = z.object({
  subject: z.string().min(3, 'Subject required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});
type FormValues = z.infer<typeof schema>;

export function ContactPage() {
  const [createInquiry, { isLoading }] = useCreateInquiryMutation();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createInquiry(data).unwrap();
      toast.success('Message sent! We\'ll get back to you soon.');
      reset();
    } catch {
      toast.error('Could not send message. Please try again.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in touch</h1>
        <p className="text-gray-500 text-lg">Have a question or need help? We'd love to hear from you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact info */}
        <div className="space-y-6">
          {[
            { icon: Mail, title: 'Email', val: 'support@trendora.com' },
            { icon: Phone, title: 'Phone', val: '+1 (555) 000-0000' },
            { icon: MapPin, title: 'Office', val: '123 Shop St, Commerce City, CA' },
          ].map(({ icon: Icon, title, val }) => (
            <div key={title} className="flex gap-4">
              <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-100 rounded-2xl p-8 space-y-5">
            <Input label="Subject" error={errors.subject?.message} placeholder="How can we help?" {...register('subject')} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
              <textarea
                rows={5}
                placeholder="Describe your question or issue…"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register('message')}
              />
              {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>}
            </div>
            <Button type="submit" isLoading={isLoading}>Send message</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
