import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe, Check } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { useUserPreferences } from '@/services/user/hooks/useUser';
import { updateLanguagePreference } from '@/services/user/api/preferences';

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
];

const LanguageSettingsContent = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: prefs, isLoading } = useUserPreferences(userId);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prefs?.language) {
      setCurrentLanguage(prefs.language);
    }
  }, [prefs?.language]);

  const handleLanguageChange = async (languageCode: string) => {
    if (!userId) return;

    try {
      setSaving(true);
      setCurrentLanguage(languageCode);
      const ok = await updateLanguagePreference(userId, languageCode);
      if (ok) {
        toast.success('Language updated');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast.error('Failed to update language');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentLanguageName = () => {
    const lang = AVAILABLE_LANGUAGES.find(l => l.code === currentLanguage);
    return lang ? `${lang.name} (${lang.nativeName})` : 'English';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='animate-pulse space-y-4'>
            <div className='h-4 bg-gray-200 rounded w-1/4' />
            <div className='h-10 bg-gray-200 rounded' />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Globe className='h-5 w-5' />
            Language Preferences
          </CardTitle>
          <CardDescription>Choose your preferred language for the interface</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Current Language</label>
            <div className='flex items-center gap-2'>
              <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
                <Check className='h-3 w-3 mr-1' />
                {getCurrentLanguageName()}
              </Badge>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Select Language</label>
            <Select value={currentLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue placeholder='Select a language' />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_LANGUAGES.map(language => (
                  <SelectItem key={language.code} value={language.code}>
                    <div className='flex items-center gap-2'>
                      <span>{language.name}</span>
                      <span className='text-muted-foreground'>({language.nativeName})</span>
                      {language.code === currentLanguage && (
                        <Check className='h-3 w-3 text-green-600' />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button disabled={saving} onClick={() => handleLanguageChange(currentLanguage)}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSettingsContent;
