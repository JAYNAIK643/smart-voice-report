/**
 * Phase 2 Notification System Enhancement - Validation Suite
 * Tests all implemented features for proper functionality
 */

const { expect } = require('chai');
const NotificationTemplateService = require('../backend/src/services/notificationTemplateService');
const EnhancedNotificationManager = require('../backend/src/services/enhancedNotificationManager');
const DigestNotificationService = require('../backend/src/services/digestNotificationService');
const EmergencyBroadcastService = require('../backend/src/services/emergencyBroadcastService');

describe('Phase 2 Notification System Enhancement', () => {
  
  describe('Notification Template Management', () => {
    it('should create and retrieve templates', async () => {
      // Test template creation
      const templateData = {
        name: 'test_template',
        channel: 'email',
        type: 'test',
        language: 'en',
        subject: 'Test Subject',
        content: 'Test Content {{variable}}',
        variables: { required: ['variable'] }
      };

      const result = await NotificationTemplateService.createTemplate(templateData);
      expect(result.success).to.be.true;
      expect(result.data).to.have.property('id');
      expect(result.data.name).to.equal('test_template');

      // Test template retrieval
      const retrieved = await NotificationTemplateService.getTemplate(
        'test_template', 
        'email', 
        'en'
      );
      expect(retrieved).to.not.be.null;
      expect(retrieved.name).to.equal('test_template');
    });

    it('should render templates with variables', async () => {
      const template = {
        subject: 'Hello {{name}}',
        content: 'Welcome {{name}}, your ID is {{id}}'
      };

      const variables = { name: 'John', id: '123' };
      const rendered = NotificationTemplateService.renderTemplate(template, variables);
      
      expect(rendered.subject).to.equal('Hello John');
      expect(rendered.content).to.equal('Welcome John, your ID is 123');
    });

    it('should validate template variables', async () => {
      const template = {
        variables: { required: ['name', 'email'], optional: ['phone'] }
      };

      const validVars = { name: 'John', email: 'john@example.com' };
      const invalidVars = { name: 'John' }; // Missing required 'email'

      const validResult = NotificationTemplateService.validateVariables(template, validVars);
      const invalidResult = NotificationTemplateService.validateVariables(template, invalidVars);

      expect(validResult.isValid).to.be.true;
      expect(invalidResult.isValid).to.be.false;
      expect(invalidResult.missing).to.include('email');
    });
  });

  describe('Enhanced Notification Manager', () => {
    it('should generate delivery tracking IDs', () => {
      const deliveryId = EnhancedNotificationManager.generateDeliveryId();
      expect(deliveryId).to.match(/^del_\d+_[a-z0-9]+$/);
    });

    it('should determine notification channels based on user preferences', () => {
      const userWithPrefs = {
        emailEnabled: true,
        email: 'test@example.com',
        smsEnabled: false,
        phone: '+1234567890'
      };

      const options = {};
      
      expect(EnhancedNotificationManager.shouldSendEmail(userWithPrefs, options)).to.be.true;
      expect(EnhancedNotificationManager.shouldSendSMS(userWithPrefs, options)).to.be.false;
    });

    it('should handle emergency broadcast preferences', () => {
      const user = { phone: '+1234567890' };
      const emergencyOptions = { bypassPreferences: true, channels: ['sms'] };
      
      expect(EnhancedNotificationManager.shouldSendSMS(user, emergencyOptions)).to.be.true;
    });
  });

  describe('Digest Notification Service', () => {
    it('should group notifications by type', () => {
      const notifications = [
        { type: 'status_update', message: 'Update 1' },
        { type: 'status_update', message: 'Update 2' },
        { type: 'resolution', message: 'Resolved' }
      ];

      const grouped = DigestNotificationService.groupNotificationsByType(notifications);
      
      expect(grouped).to.have.property('status_update');
      expect(grouped).to.have.property('resolution');
      expect(grouped.status_update).to.have.length(2);
      expect(grouped.resolution).to.have.length(1);
    });

    it('should convert time strings to milliseconds', () => {
      const dayMs = DigestNotificationService.getTimeInMs('24 hours');
      const weekMs = DigestNotificationService.getTimeInMs('7 days');
      
      expect(dayMs).to.equal(24 * 60 * 60 * 1000);
      expect(weekMs).to.equal(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('Emergency Broadcast Service', () => {
    it('should validate broadcast data', () => {
      const validData = {
        title: 'Emergency Alert',
        message: 'This is a test emergency message',
        severity: 'high'
      };

      const invalidData = {
        title: '', // Required field missing
        message: 'Test message'
      };

      const validResult = EmergencyBroadcastService.validateBroadcastData(validData);
      const invalidResult = EmergencyBroadcastService.validateBroadcastData(invalidData);

      expect(validResult.isValid).to.be.true;
      expect(invalidResult.isValid).to.be.false;
      expect(invalidResult.errors).to.include('Title is required');
    });

    it('should validate severity levels', () => {
      const testData = {
        title: 'Test',
        message: 'Test message',
        severity: 'invalid_severity'
      };

      const result = EmergencyBroadcastService.validateBroadcastData(testData);
      expect(result.isValid).to.be.false;
    });
  });

  describe('Integration Tests', () => {
    it('should coordinate template and delivery services', async () => {
      // Create a test template
      const templateData = {
        name: 'integration_test',
        channel: 'email',
        type: 'test',
        language: 'en',
        subject: 'Integration Test',
        content: 'Testing integration: {{testVar}}',
        variables: { required: ['testVar'] }
      };

      await NotificationTemplateService.createTemplate(templateData);

      // Verify template can be retrieved and rendered
      const template = await NotificationTemplateService.getTemplate(
        'integration_test', 
        'email', 
        'en'
      );

      expect(template).to.not.be.null;
      
      const rendered = NotificationTemplateService.renderTemplate(
        template, 
        { testVar: 'SUCCESS' }
      );

      expect(rendered.content).to.contain('SUCCESS');
    });

    it('should handle batch processing gracefully', () => {
      const largeArray = Array.from({ length: 250 }, (_, i) => ({ id: i }));
      const batches = EnhancedNotificationManager.createBatches(largeArray, 100);
      
      expect(batches).to.have.length(3);
      expect(batches[0]).to.have.length(100);
      expect(batches[1]).to.have.length(100);
      expect(batches[2]).to.have.length(50);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent template operations', async () => {
      const startTime = Date.now();
      
      // Create multiple templates concurrently
      const promises = Array.from({ length: 10 }, (_, i) => 
        NotificationTemplateService.createTemplate({
          name: `perf_test_${i}`,
          channel: 'email',
          type: 'performance',
          language: 'en',
          subject: `Perf Test ${i}`,
          content: `Performance test content ${i}`,
          variables: {}
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // All should succeed
      results.forEach(result => {
        expect(result.success).to.be.true;
      });
      
      // Should complete within reasonable time
      expect(endTime - startTime).to.be.lessThan(5000); // 5 seconds
    });
  });
});

console.log('🧪 Phase 2 Notification Enhancement Validation Suite');
console.log('Running comprehensive tests for all implemented features...\n');

// Run the tests
describe.run();