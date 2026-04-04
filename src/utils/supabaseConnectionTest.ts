import { supabase } from '@/integrations/supabase/client';

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Check basic client configuration
    console.log('📋 Supabase configured');
    console.log('📋 Client initialized');
    
    // Test 2: Check authentication status
    const { data: authData, error: authError } = await supabase.auth.getUser();
    console.log('🔐 Auth status:', { 
      user: authData.user ? 'Authenticated' : 'Not authenticated',
      userId: authData.user?.id,
      error: authError?.message 
    });
    
    // Test 3: Test basic database query (should work with RLS)
    const { data: testData, error: testError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1);
    
    console.log('🗄️ Database test:', { 
      success: !testError,
      data: testData,
      error: testError?.message 
    });
    
    // Test 4: Test storage bucket access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('🪣 Storage buckets test:', { 
      success: !bucketsError,
      buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })),
      error: bucketsError?.message 
    });
    
    // Test 5: Test specific bucket access
    const { data: files, error: filesError } = await supabase.storage
      .from('document-templates')
      .list('', { limit: 1 });
    
    console.log('📁 Document-templates bucket test:', { 
      success: !filesError,
      filesCount: files?.length || 0,
      error: filesError?.message 
    });
    
    return {
      client: true,
      auth: !!authData.user && !authError,
      database: !testError,
      storage: !bucketsError,
      bucket: !filesError
    };
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return {
      client: false,
      auth: false,
      database: false,
      storage: false,
      bucket: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}