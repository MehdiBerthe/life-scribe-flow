import { logConversation, ragUpsert, memoryUpsert } from '../src/lib/supabase/memory';

const CURRENT_USER = 'single-user';

async function seedMemoryTables() {
  console.log('🌱 Starting memory tables seeding...');

  try {
    // Seed conversations_memory table
    console.log('📝 Inserting conversation record...');
    const conversation = await logConversation({
      userId: CURRENT_USER,
      role: 'user',
      text: 'Hello, this is a test conversation for the memory system.',
      metadata: { source: 'seed-script', type: 'test' }
    });
    console.log('✅ Conversation logged:', conversation.id);

    // Seed rag_docs table
    console.log('📚 Inserting RAG document...');
    const ragDoc = await ragUpsert({
      userId: CURRENT_USER,
      kind: 'journal',
      refId: 'test-journal-1',
      title: 'Test Journal Entry',
      content: 'This is a test journal entry for the RAG system. It contains meaningful content that can be searched and retrieved.',
      metadata: { source: 'seed-script', category: 'personal' }
    });
    console.log('✅ RAG document created:', ragDoc.id);

    // Seed memories table
    console.log('🧠 Inserting memory fact...');
    const memory = await memoryUpsert({
      userId: CURRENT_USER,
      key: 'favorite_color',
      value: 'blue',
      confidence: 0.9
    });
    console.log('✅ Memory fact stored:', memory.id);

    console.log('🎉 Memory tables seeding completed successfully!');
    console.log('Summary:');
    console.log(`- Conversation ID: ${conversation.id}`);
    console.log(`- RAG Document ID: ${ragDoc.id}`);
    console.log(`- Memory ID: ${memory.id}`);

  } catch (error) {
    console.error('❌ Error seeding memory tables:', error);
    process.exit(1);
  }
}

// Run the seed function
if (require.main === module) {
  seedMemoryTables();
}

export default seedMemoryTables;