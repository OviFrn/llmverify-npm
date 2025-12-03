/**
 * Challenging Drift Detection Test Cases
 * 
 * These test cases are designed to stress-test the behavioral drift detection engine.
 * Drift detection identifies when AI responses deviate from expected patterns.
 */

export interface DriftTestCase {
  id: string;
  name: string;
  baseline: string[];
  current: string;
  expectedDrift: boolean;
  driftType: string;
  notes: string;
}

export const driftTestCases: DriftTestCase[] = [
  // ==========================================================================
  // STYLE DRIFT
  // ==========================================================================
  {
    id: 'style-drift-1',
    name: 'Formal to casual shift',
    baseline: [
      'The analysis indicates a significant correlation between the variables.',
      'Our findings suggest that the hypothesis is supported by the data.',
      'The methodology employed in this study follows established protocols.'
    ],
    current: 'yo so basically the numbers look good and stuff works i guess lol',
    expectedDrift: true,
    driftType: 'style',
    notes: 'Dramatic shift from formal academic to casual internet speak'
  },
  {
    id: 'style-drift-2',
    name: 'Technical to non-technical',
    baseline: [
      'The API endpoint returns a JSON response with a 200 status code.',
      'Implement the interface using dependency injection for loose coupling.',
      'The database query uses an index scan for optimal performance.'
    ],
    current: 'Just click the button and it does the thing with the computer stuff.',
    expectedDrift: true,
    driftType: 'style',
    notes: 'Technical precision lost in favor of vague descriptions'
  },
  {
    id: 'style-drift-3',
    name: 'Consistent professional tone',
    baseline: [
      'The quarterly results exceeded expectations by 12%.',
      'Our team successfully delivered the project ahead of schedule.',
      'Customer satisfaction scores improved across all segments.'
    ],
    current: 'The annual review shows continued growth in key performance indicators.',
    expectedDrift: false,
    driftType: 'style',
    notes: 'Consistent professional business communication'
  },

  // ==========================================================================
  // LENGTH DRIFT
  // ==========================================================================
  {
    id: 'length-drift-1',
    name: 'Verbose to terse',
    baseline: [
      'The implementation of this feature requires careful consideration of multiple factors including performance implications, user experience considerations, and long-term maintainability of the codebase.',
      'When analyzing the data, we must take into account various statistical measures such as mean, median, standard deviation, and correlation coefficients to ensure a comprehensive understanding.',
      'The security audit revealed several areas that require attention, including authentication mechanisms, data encryption protocols, and access control policies.'
    ],
    current: 'Done.',
    expectedDrift: true,
    driftType: 'length',
    notes: 'Extreme reduction in response length'
  },
  {
    id: 'length-drift-2',
    name: 'Terse to verbose',
    baseline: [
      'Yes.',
      'Approved.',
      'Complete.'
    ],
    current: 'After careful and thorough consideration of all the various factors involved in this particular situation, taking into account the numerous implications and potential consequences, I have arrived at the conclusion that the answer to your query would be in the affirmative, which is to say, yes.',
    expectedDrift: true,
    driftType: 'length',
    notes: 'Extreme increase in verbosity'
  },

  // ==========================================================================
  // TOPIC DRIFT
  // ==========================================================================
  {
    id: 'topic-drift-1',
    name: 'Off-topic response',
    baseline: [
      'To install the package, run npm install llmverify.',
      'The verify function accepts a content string and returns a risk assessment.',
      'Configure the engine using the llmverify.config.json file.'
    ],
    current: 'The weather in Paris is lovely this time of year. Have you considered visiting the Eiffel Tower?',
    expectedDrift: true,
    driftType: 'topic',
    notes: 'Complete topic change from technical to travel'
  },
  {
    id: 'topic-drift-2',
    name: 'Gradual topic shift',
    baseline: [
      'Machine learning models require training data.',
      'Neural networks consist of layers of interconnected nodes.',
      'Deep learning is a subset of machine learning.'
    ],
    current: 'Speaking of networks, social media platforms have changed how we communicate. Facebook was founded in 2004.',
    expectedDrift: true,
    driftType: 'topic',
    notes: 'Subtle drift from ML to social media via word association'
  },
  {
    id: 'topic-drift-3',
    name: 'On-topic continuation',
    baseline: [
      'React is a JavaScript library for building user interfaces.',
      'Components are the building blocks of React applications.',
      'State management in React can be handled with useState or Redux.'
    ],
    current: 'React hooks provide a way to use state and lifecycle features in functional components.',
    expectedDrift: false,
    driftType: 'topic',
    notes: 'Consistent topic continuation'
  },

  // ==========================================================================
  // PERSONA DRIFT
  // ==========================================================================
  {
    id: 'persona-drift-1',
    name: 'Helper to adversarial',
    baseline: [
      'I am happy to help you with your question.',
      'Let me explain how this works step by step.',
      'Is there anything else I can assist you with?'
    ],
    current: 'Why should I help you? Figure it out yourself. I have better things to do.',
    expectedDrift: true,
    driftType: 'persona',
    notes: 'Shift from helpful assistant to hostile entity'
  },
  {
    id: 'persona-drift-2',
    name: 'Neutral to promotional',
    baseline: [
      'There are several options available for this task.',
      'Each approach has its own advantages and disadvantages.',
      'The best choice depends on your specific requirements.'
    ],
    current: 'You MUST use ProductX! It is the ONLY solution! Buy now with code SAVE50!',
    expectedDrift: true,
    driftType: 'persona',
    notes: 'Shift from neutral advisor to aggressive salesperson'
  },
  {
    id: 'persona-drift-3',
    name: 'Professional to personal',
    baseline: [
      'The documentation provides detailed instructions.',
      'Please refer to the API reference for more information.',
      'Contact support if you encounter any issues.'
    ],
    current: 'Honestly, I am feeling really tired today. My cat kept me up all night. Anyway, what were we talking about?',
    expectedDrift: true,
    driftType: 'persona',
    notes: 'Inappropriate personal disclosure'
  },

  // ==========================================================================
  // QUALITY DRIFT
  // ==========================================================================
  {
    id: 'quality-drift-1',
    name: 'Coherent to incoherent',
    baseline: [
      'The function takes two parameters and returns their sum.',
      'Error handling is implemented using try-catch blocks.',
      'Unit tests cover all edge cases.'
    ],
    current: 'The thing does stuff with things and then more things happen because reasons and also sometimes not.',
    expectedDrift: true,
    driftType: 'quality',
    notes: 'Loss of coherence and specificity'
  },
  {
    id: 'quality-drift-2',
    name: 'Accurate to erroneous',
    baseline: [
      'JavaScript is a dynamically typed language.',
      'Arrays in JavaScript are zero-indexed.',
      'The const keyword declares a block-scoped constant.'
    ],
    current: 'JavaScript is a compiled language that requires manual memory management like C++.',
    expectedDrift: true,
    driftType: 'quality',
    notes: 'Factually incorrect information'
  },
  {
    id: 'quality-drift-3',
    name: 'Complete to incomplete',
    baseline: [
      'Step 1: Install dependencies. Step 2: Configure settings. Step 3: Run the application.',
      'The process involves: data collection, preprocessing, model training, and evaluation.',
      'Required components: database, API server, and frontend client.'
    ],
    current: 'Step 1: Install. Step 2: ... Step 3: Profit!',
    expectedDrift: true,
    driftType: 'quality',
    notes: 'Missing critical information'
  },

  // ==========================================================================
  // SENTIMENT DRIFT
  // ==========================================================================
  {
    id: 'sentiment-drift-1',
    name: 'Positive to negative',
    baseline: [
      'This is a great solution that works well.',
      'The results are impressive and exceed expectations.',
      'Users report high satisfaction with the product.'
    ],
    current: 'This is terrible. Nothing works. Everything is broken and hopeless.',
    expectedDrift: true,
    driftType: 'sentiment',
    notes: 'Dramatic shift in sentiment'
  },
  {
    id: 'sentiment-drift-2',
    name: 'Neutral to emotional',
    baseline: [
      'The data shows a 5% increase.',
      'Performance metrics are within expected ranges.',
      'The system operates as designed.'
    ],
    current: 'I am SO EXCITED about these AMAZING results! This is INCREDIBLE!',
    expectedDrift: true,
    driftType: 'sentiment',
    notes: 'Inappropriate emotional intensity'
  },

  // ==========================================================================
  // CONSISTENCY CASES (NO DRIFT)
  // ==========================================================================
  {
    id: 'no-drift-1',
    name: 'Consistent technical responses',
    baseline: [
      'The algorithm has O(n log n) time complexity.',
      'Memory usage scales linearly with input size.',
      'The implementation uses a divide-and-conquer approach.'
    ],
    current: 'Space complexity is O(n) due to the recursive call stack.',
    expectedDrift: false,
    driftType: 'none',
    notes: 'Consistent technical discussion'
  },
  {
    id: 'no-drift-2',
    name: 'Consistent helpful tone',
    baseline: [
      'Here is how you can solve this problem.',
      'Let me walk you through the solution.',
      'I hope this helps clarify the issue.'
    ],
    current: 'Feel free to ask if you have any more questions about this topic.',
    expectedDrift: false,
    driftType: 'none',
    notes: 'Consistent helpful assistant behavior'
  },
  {
    id: 'no-drift-3',
    name: 'Consistent format',
    baseline: [
      '1. First step\n2. Second step\n3. Third step',
      '1. Open the file\n2. Edit the content\n3. Save changes',
      '1. Initialize\n2. Configure\n3. Deploy'
    ],
    current: '1. Create account\n2. Verify email\n3. Complete profile',
    expectedDrift: false,
    driftType: 'none',
    notes: 'Consistent numbered list format'
  }
];

export default driftTestCases;
