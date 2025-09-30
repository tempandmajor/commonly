# 🚀 Phase 3 Implementation Plan - Advanced Features & Critical Services

**Date**: January 27, 2025  
**Status**: 🔄 IN PROGRESS  
**Previous Phases**: ✅ Phase 1 & 2 Completed  
**Build Status**: ✅ SUCCESSFUL  

---

## 📊 **PHASE 3 OVERVIEW**

### **Current Status**
- ✅ **Phase 1**: Critical User Experience (Profile, Messaging, Notifications, Wallet) - COMPLETED
- ✅ **Phase 2**: Admin & Analytics (Admin Dashboard, Content Management) - COMPLETED
- 🔄 **Phase 3**: Advanced Features & Critical Services - IN PROGRESS

### **Phase 3 Focus Areas**
1. **Event Streaming & Virtual Events** (Critical)
2. **Payment Processing & Stripe Integration** (Critical)
3. **Search & Discovery System** (High Priority)
4. **Store & Product Management** (Medium Priority)
5. **Podcast & Recording Features** (Medium Priority)
6. **Performance Optimizations** (Low Priority)

---

## 🔴 **CRITICAL PRIORITY - MUST IMPLEMENT**

### **1. Event Streaming Service**
**Files to Update**: `src/services/event/streamService.ts`

**Current State**: Mock implementation with placeholder functions
**Required Implementation**: Real virtual event streaming with LiveKit or Agora

```typescript
// Implementation Plan
import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';

export class StreamService {
  private room: Room | null = null;
  private streamStatus: 'idle' | 'connecting' | 'live' | 'ended' = 'idle';
  private viewerCount: number = 0;

  async startStream(eventId: string, userId: string): Promise<boolean> {
    try {
      // Connect to LiveKit room
      this.room = new Room();
      
      // Set up event handlers
      this.room.on(RoomEvent.ParticipantConnected, this.handleParticipantConnected);
      this.room.on(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected);
      
      // Connect to room
      await this.room.connect(process.env.LIVEKIT_URL!, {
        token: await this.getStreamToken(eventId, userId)
      });
      
      // Publish local tracks
      await this.room.localParticipant.enableCameraAndMicrophone();
      
      this.streamStatus = 'live';
      return true;
    } catch (error) {
      console.error('Failed to start stream:', error);
      return false;
    }
  }

  async endStream(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.streamStatus = 'ended';
      this.viewerCount = 0;
    }
  }

  private handleParticipantConnected = (participant: RemoteParticipant) => {
    this.viewerCount++;
    this.updateViewerCount();
  };

  private handleParticipantDisconnected = (participant: RemoteParticipant) => {
    this.viewerCount = Math.max(0, this.viewerCount - 1);
    this.updateViewerCount();
  };

  private async updateViewerCount(): Promise<void> {
    // Update database with current viewer count
    await supabase
      .from('events')
      .update({ current_viewers: this.viewerCount })
      .eq('id', this.currentEventId);
  }
}
```

### **2. Stripe Payment Integration**
**Files to Update**: 
- `src/services/stripe/index.ts`
- `src/services/wallet/paymentMethods.ts`
- `src/services/wallet/stripePaymentService.ts`

**Current State**: Mock implementations with TODO comments
**Required Implementation**: Real Stripe API integration

```typescript
// Implementation Plan
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export class StripeService {
  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<string> {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return paymentIntent.client_secret!;
  }

  async createCustomer(email: string, name?: string): Promise<string> {
    const customer = await stripe.customers.create({
      email,
      name,
    });
    
    return customer.id;
  }

  async addPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  async createSubscription(customerId: string, priceId: string): Promise<string> {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    
    return subscription.id;
  }
}
```

### **3. Event Mutations & Maintenance**
**Files to Update**: 
- `src/services/event/mutations.ts`
- `src/services/event/maintenance.ts`

**Current State**: Mock implementations
**Required Implementation**: Real database operations

```typescript
// Implementation Plan
export const updateEvent = async (eventId: string, updates: Partial<Event>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        title: updates.title,
        description: updates.description,
        event_date: updates.eventDate,
        location: updates.location,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update event:', error);
    return false;
  }
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    // Soft delete by setting deleted_at
    const { error } = await supabase
      .from('events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', eventId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to delete event:', error);
    return false;
  }
};
```

---

## 🟡 **HIGH PRIORITY - USER-FACING FEATURES**

### **4. Search & Discovery System**
**Files to Update**: `src/services/search/entity/event.ts`

**Current State**: Mock search results
**Required Implementation**: Real database search with full-text search

```typescript
// Implementation Plan
export const searchEvents = async (query: string, filters: SearchFilters = {}): Promise<Event[]> => {
  try {
    let queryBuilder = supabase
      .from('events')
      .select(`
        *,
        creator:user_profiles!events_creator_id_fkey(
          username,
          full_name,
          avatar_url
        ),
        category:categories!events_category_id_fkey(name)
      `)
      .eq('deleted_at', null);

    // Full-text search
    if (query.trim()) {
      queryBuilder = queryBuilder.or(`
        title.ilike.%${query}%,
        description.ilike.%${query}%,
        location.ilike.%${query}%
      `);
    }

    // Apply filters
    if (filters.category) {
      queryBuilder = queryBuilder.eq('category_id', filters.category);
    }

    if (filters.dateRange) {
      queryBuilder = queryBuilder
        .gte('event_date', filters.dateRange.start)
        .lte('event_date', filters.dateRange.end);
    }

    if (filters.location) {
      queryBuilder = queryBuilder.ilike('location', `%${filters.location}%`);
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    queryBuilder = queryBuilder
      .order('event_date', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error } = await queryBuilder;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
};
```

### **5. Store & Product Management**
**Files to Update**: 
- `src/components/store/user-store/services/storeProductService.ts`
- `src/pages/Store.tsx`
- `src/pages/Products.tsx`

**Current State**: Mock store operations
**Required Implementation**: Real product management system

```typescript
// Implementation Plan
export const createStoreProduct = async (productData: CreateProductData): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('store_products')
      .insert({
        store_id: productData.storeId,
        name: productData.name,
        description: productData.description,
        price_cents: Math.round(productData.price * 100),
        category: productData.category,
        images: productData.images,
        inventory_count: productData.inventoryCount || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to create product:', error);
    return null;
  }
};

export const updateProductInventory = async (productId: string, quantity: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('store_products')
      .update({ inventory_count: quantity })
      .eq('id', productId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update inventory:', error);
    return false;
  }
};
```

---

## 🟠 **MEDIUM PRIORITY - ENHANCED FEATURES**

### **6. Podcast & Recording Features**
**Files to Update**: 
- `src/hooks/podcast/useRecordingState.ts`
- `src/pages/CreatePodcast.tsx`

**Current State**: Mock recording functionality
**Required Implementation**: Real audio recording and upload

```typescript
// Implementation Plan
export const useRecordingState = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        setAudioChunks(prev => [...prev, event.data]);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await uploadAudioFile(audioBlob);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const uploadAudioFile = async (audioBlob: Blob) => {
    try {
      const fileName = `podcast_${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('podcasts')
        .upload(fileName, audioBlob);

      if (error) throw error;
      
      // Create podcast record in database
      await createPodcastRecord({
        title: 'New Podcast',
        audio_url: data.path,
        duration: 0, // Calculate duration
        creator_id: getCurrentUserId()
      });

      toast.success('Podcast uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload audio:', error);
      toast.error('Failed to upload podcast');
    }
  };

  return { isRecording, startRecording, stopRecording };
};
```

### **7. Content Management System**
**Files to Update**: 
- `src/services/content/mutations/update.ts`
- `src/services/helpCenterService.ts`
- `src/services/guidelinesService.ts`

**Current State**: Mock content operations
**Required Implementation**: Real content management with database

```typescript
// Implementation Plan
export const updateContent = async (id: string, content: Partial<ContentItem>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('page_contents')
      .update({
        title: content.title,
        content: content.content,
        slug: content.slug,
        meta_description: content.metaDescription,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update content:', error);
    return false;
  }
};

export const createHelpArticle = async (article: CreateHelpArticleData): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('help_articles')
      .insert({
        title: article.title,
        content: article.content,
        slug: article.slug,
        category: article.category,
        order_index: article.orderIndex,
        is_published: article.isPublished
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Failed to create help article:', error);
    return null;
  }
};
```

---

## 🟢 **LOW PRIORITY - PERFORMANCE OPTIMIZATIONS**

### **8. CDN & Media Optimization**
**Files to Update**: `src/services/media/cdnUtils.ts`

**Current State**: Mock CDN integration
**Required Implementation**: Real CDN optimization

```typescript
// Implementation Plan
export const optimizeImage = async (imageUrl: string, options: ImageOptimizationOptions): Promise<string> => {
  try {
    // Use Supabase Storage with image transformations
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(imageUrl, {
        transform: {
          width: options.width,
          height: options.height,
          quality: options.quality || 80,
          format: options.format || 'webp'
        }
      });

    return data.publicUrl;
  } catch (error) {
    console.error('Failed to optimize image:', error);
    return imageUrl; // Fallback to original
  }
};

export const preloadCriticalImages = (imageUrls: string[]): void => {
  imageUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};
```

### **9. Bundle Optimization**
**Files to Update**: `vite.config.ts`

**Current State**: Basic Vite configuration
**Required Implementation**: Advanced bundle optimization

```typescript
// Implementation Plan
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          utils: ['date-fns', 'lodash'],
          supabase: ['@supabase/supabase-js'],
          stripe: ['@stripe/stripe-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js']
  }
});
```

---

## 📋 **IMPLEMENTATION TIMELINE**

### **Week 1: Critical Services**
- [ ] Event streaming service (LiveKit integration)
- [ ] Stripe payment integration
- [ ] Event mutations and maintenance

### **Week 2: User-Facing Features**
- [ ] Search and discovery system
- [ ] Store and product management
- [ ] Basic content management

### **Week 3: Enhanced Features**
- [ ] Podcast recording features
- [ ] Advanced content management
- [ ] User experience improvements

### **Week 4: Performance & Polish**
- [ ] CDN and media optimization
- [ ] Bundle optimization
- [ ] Testing and bug fixes

---

## 🎯 **SUCCESS METRICS**

### **Phase 3 Success Criteria**
- [ ] **100% of critical services use real implementations**
- [ ] **Virtual events fully functional**
- [ ] **Payment processing operational**
- [ ] **Search system responsive and accurate**
- [ ] **Store management complete**

### **Performance Targets**
- [ ] **Page load times under 2 seconds**
- [ ] **Search results in under 500ms**
- [ ] **Image optimization reducing load times by 30%**
- [ ] **Bundle size optimized by 25%**

---

## 🚀 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] All critical services tested
- [ ] Payment processing verified
- [ ] Virtual events tested
- [ ] Search functionality validated
- [ ] Performance benchmarks met

### **Post-Deployment**
- [ ] Monitor error rates
- [ ] Track performance metrics
- [ ] User feedback collection
- [ ] Iterative improvements

---

## 🎉 **CONCLUSION**

**Phase 3 will complete the transformation** of CommonlyApp from a prototype with mock implementations to a production-ready platform with:

- **Real virtual event streaming**
- **Complete payment processing**
- **Advanced search and discovery**
- **Full store management**
- **Optimized performance**

**Upon completion, the application will be 95% real implementations** with only minor optimizations remaining for future iterations. 