import { logConversation, ragUpsert, memoryUpsert } from '../src/lib/supabase/memory';

const CURRENT_USER_ID = 'single-user'; // Using the default user ID from your system

async function seedMemoryTables() {
  console.log('🌱 Seeding memory tables...');

  try {
    // 1. Insert a conversation record
    console.log('📝 Creating conversation record...');
    const conversationResult = await logConversation({
      userId: CURRENT_USER_ID,
      role: 'user',
      text: 'Hello, this is a test conversation entry for the memory system.',
      metadata: { source: 'seed_script', timestamp: new Date().toISOString() }
    });
    console.log('✅ Conversation logged:', conversationResult.id);

    // 2. Insert a RAG document
    console.log('📚 Creating RAG document...');
    const ragResult = await ragUpsert({
      userId: CURRENT_USER_ID,
      kind: 'journal',
      refId: 'seed-entry-1',
      title: 'Seed Journal Entry',
      content: 'This is a test journal entry created by the seed script to demonstrate the RAG document storage system.',
      metadata: { 
        source: 'seed_script', 
        category: 'test',
        created_at: new Date().toISOString()
      }
    });
    console.log('✅ RAG document created:', ragResult.id);

    // 3. Insert a memory fact
    console.log('🧠 Creating memory fact...');
    const memoryResult = await memoryUpsert({
      userId: CURRENT_USER_ID,
      key: 'favorite_programming_language',
      value: 'TypeScript',
      confidence: 0.9
    });
    console.log('✅ Memory fact stored:', memoryResult.id);

    // 4. Insert another memory fact
    console.log('🧠 Creating another memory fact...');
    const memoryResult2 = await memoryUpsert({
      userId: CURRENT_USER_ID,
      key: 'last_seed_run',
      value: new Date().toISOString(),
      confidence: 1.0
    });
    console.log('✅ Second memory fact stored:', memoryResult2.id);

    console.log('\n🎉 All memory tables seeded successfully!');
    console.log('\nSummary:');
    console.log(`- Conversation ID: ${conversationResult.id}`);
    console.log(`- RAG Document ID: ${ragResult.id}`);
    console.log(`- Memory Fact 1 ID: ${memoryResult.id}`);
    console.log(`- Memory Fact 2 ID: ${memoryResult2.id}`);

  } catch (error) {
    console.error('❌ Error seeding memory tables:', error);
    process.exit(1);
  }
}

// Run the seed script
if (require.main === module) {
  seedMemoryTables()
    .then(() => {
      console.log('\n✨ Seed script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seed script failed:', error);
      process.exit(1);
    });
}

export { seedMemoryTables };