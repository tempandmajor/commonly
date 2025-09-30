import React, { useState } from 'react';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import SearchBox from '@/components/help/SearchBox';
import ArticleContent from '@/components/help/ArticleContent';
import { HelpArticle } from '@/services/helpCenterService';
import { helpSections, faqItems } from '@/lib/help-data';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const HelpCenter = () => {
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  // Convert FAQ items to the HelpArticle format with required timestamps
  const articles: HelpArticle[] = [
          ...faqItems.map((item, index) => ({
      id: `faq-${index}`,
      title: item.question,
      content: item.answer,
      category: 'FAQ',
      tags: ['faq'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    // Add help articles from sections
          ...helpSections.flatMap(section =>
      section.items.map(item => ({
        id: item.link.replace('/', ''),
        title: item.title,
        content: `<p>${item.description || `Detailed guide about ${item.title}`}</p>`,
        category: section.title,
        tags: [section.title.toLowerCase()],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    ),
  ];

  return (
    <div className='min-h-screen flex flex-col'>
      <SimpleHeader />

      <main className='flex-1 container mx-auto py-12 px-4'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-4xl font-bold mb-4'>Help Center</h1>
          <p className='text-xl text-muted-foreground mb-8'>
            Find comprehensive guides and answers to help you make the most of our platform
          </p>

          <SearchBox articles={articles} onArticleSelect={setSelectedArticle} />

          <Separator className='my-8' />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-12'>
            {helpSections.map(section => (
              <div
                key={section.title}
                className='space-y-4 hover:bg-muted/50 p-6 rounded-lg transition-colors'
              >
                <h2 className='text-2xl font-semibold'>{section.title}</h2>
                <p className='text-muted-foreground'>{section.description}</p>
                <ul className='space-y-2'>
                  {section.items.map(item => (
                    <li key={item.title}>
                      <Link
                        to={item.link}
                        className='text-primary hover:underline inline-flex items-center'
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className='space-y-6 mb-12'>
            <h2 className='text-2xl font-semibold'>Frequently Asked Questions</h2>
            <Accordion type='single' collapsible className='w-full'>
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className='grid md:grid-cols-2 gap-6'>
            <div className='p-6 bg-muted rounded-lg'>
              <h3 className='text-xl font-semibold mb-4'>Need More Help?</h3>
              <p className='mb-6'>
                Our support team is here to assist you with any questions or issues.
              </p>
              <Link to='/contact'>
                <Button className='w-full'>Contact Support</Button>
              </Link>
            </div>

            <div className='p-6 bg-muted rounded-lg'>
              <h3 className='text-xl font-semibold mb-4'>Platform Documentation</h3>
              <p className='mb-6'>
                Access detailed technical documentation and developer resources.
              </p>
              <Link to='/docs'>
                <Button variant='outline' className='w-full'>
                  View Documentation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {selectedArticle && (
        <ArticleContent article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}

      <Footer />
    </div>
  );
};

export default HelpCenter;
