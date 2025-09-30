import { Separator } from '@/components/ui/separator';
import { TeamMember } from '@/services/studioService';

interface TeamSectionProps {
  teamMembers: TeamMember[];
}

const TeamSection = ({ teamMembers }: TeamSectionProps) => {
  return (
    <section className='bg-[#f8f8f8] py-20'>
      <div className='container mx-auto px-4'>
        <h2 className='mb-4 text-4xl font-bold'>Our Team</h2>
        <p className='mb-12 text-xl text-[#2B2B2B]/70'>
          Meet the creative minds behind Commonly Studios.
        </p>

        <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {teamMembers.map(member => (
            <div key={member.id} className='overflow-hidden rounded-lg bg-white shadow-sm'>
              <div className='aspect-square overflow-hidden bg-gray-200'>
                <img src={member.image} alt={member.name} className='h-full w-full object-cover' />
              </div>
              <div className='p-6'>
                <h3 className='text-xl font-bold'>{member.name}</h3>
                <p className='text-[#2B2B2B]/70'>{member.position}</p>
                <Separator className='my-4' />
                <p className='text-sm text-[#2B2B2B]/70'>{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
