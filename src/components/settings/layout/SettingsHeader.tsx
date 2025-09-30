
interface SettingsHeaderProps {
  returnTo?: string | undefined| null;
}

const SettingsHeader = ({ returnTo }: SettingsHeaderProps) => {
  return (
    <>
      <h1 className='text-3xl font-bold tracking-tight'>Settings</h1>
      <p className='text-muted-foreground'>
        Manage your account settings and preferences
        {returnTo && (
          <span className='ml-2 text-sm font-medium text-blue-500'>
            (You'll be redirected back after completing Stripe Connect setup)
          </span>
        )}
      </p>
    </>
  );
};

export default SettingsHeader;
