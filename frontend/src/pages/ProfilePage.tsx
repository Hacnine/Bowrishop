import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useGetProfileQuery, useUpdateProfileMutation } from '../features/auth/authApi';
import { useChangePasswordMutation } from '../features/auth/authApi';
import { useAppDispatch } from '../app/hooks';
import { updateUser } from '../features/auth/authSlice';
import { useUploadImageMutation } from '../features/admin/adminApi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const { data: profile, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: savingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPw }] = useChangePasswordMutation();
  const [uploadImage] = useUploadImageMutation();
  const [avatarUploading, setAvatarUploading] = useState(false);

  const {
    register: regProfile, handleSubmit: handleProfile, formState: { errors: pErrors },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: { name: profile?.name ?? '' } });

  const {
    register: regPw, handleSubmit: handlePw, formState: { errors: pwErrors }, reset: resetPw,
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onSaveProfile = async (data: ProfileForm) => {
    try {
      const updated = await updateProfile(data).unwrap();
      dispatch(updateUser(updated));
      toast.success('Profile updated');
    } catch {
      toast.error('Could not update profile');
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }).unwrap();
      toast.success('Password changed');
      resetPw();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message ?? 'Could not change password');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      console.log('Uploading avatar:', file.name, file.size);
      const url = await uploadImage(formData).unwrap();
      console.log('Upload response:', url);
      if (url && typeof url === 'string') {
        await updateProfile({ avatar: url }).unwrap();
        dispatch(updateUser({ avatar: url } as any));
        toast.success('Avatar updated');
      } else {
        console.error('Invalid URL response:', url);
        toast.error('Could not upload avatar: Invalid response');
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(error?.data?.message || 'Could not upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* Avatar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-6">
        <div className="relative">
          <img
            src={profile?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name ?? 'U')}&background=6366f1&color=fff`}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover"
          />
          {avatarUploading && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{profile?.name}</p>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          <label className="mt-2 inline-block cursor-pointer text-sm text-indigo-600 hover:underline">
            Change avatar
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>
      </div>

      {/* Edit name */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Edit profile</h2>
        <form onSubmit={handleProfile(onSaveProfile)} className="space-y-4">
          <Input
            label="Full name"
            error={pErrors.name?.message}
            defaultValue={profile?.name}
            {...regProfile('name')}
          />
          <Button type="submit" isLoading={savingProfile}>Save changes</Button>
        </form>
      </div>

      {/* Change password */}
      {!profile?.googleId && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Change password</h2>
          <form onSubmit={handlePw(onChangePassword)} className="space-y-4">
            <Input label="Current password" type="password" error={pwErrors.currentPassword?.message} {...regPw('currentPassword')} />
            <Input label="New password" type="password" error={pwErrors.newPassword?.message} {...regPw('newPassword')} />
            <Input label="Confirm new password" type="password" error={pwErrors.confirmPassword?.message} {...regPw('confirmPassword')} />
            <Button type="submit" isLoading={changingPw} variant="outline">Change password</Button>
          </form>
        </div>
      )}
    </div>
  );
}
