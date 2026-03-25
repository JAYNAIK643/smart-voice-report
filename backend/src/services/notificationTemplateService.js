const supabase = require('../../integrations/supabase/client');

/**
 * Notification Template Management Service
 * Centralized system for managing notification templates across all channels
 */

class NotificationTemplateService {
  /**
   * Get template by name, channel, and language
   * @param {string} name - Template name
   * @param {string} channel - Channel type (email, sms, push, in_app)
   * @param {string} language - Language code (default: 'en')
   * @returns {Promise<Object|null>}
   */
  static async getTemplate(name, channel, language = 'en') {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('name', name)
        .eq('channel', channel)
        .eq('language', language)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  /**
   * Get all active templates
   * @returns {Promise<Array>}
   */
  static async getAllTemplates() {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  /**
   * Create new template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>}
   */
  static async createTemplate(templateData) {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .insert([{
          name: templateData.name,
          channel: templateData.channel,
          type: templateData.type,
          language: templateData.language || 'en',
          subject: templateData.subject,
          content: templateData.content,
          variables: templateData.variables || {},
          is_active: templateData.is_active !== undefined ? templateData.is_active : true
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Template created:', data.name);
      return { success: true, data };
    } catch (error) {
      console.error('Error creating template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update existing template
   * @param {string} templateId - Template ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>}
   */
  static async updateTemplate(templateId, updates) {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Template updated:', data.name);
      return { success: true, data };
    } catch (error) {
      console.error('Error updating template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Render template with variables
   * @param {Object} template - Template object
   * @param {Object} variables - Variables to interpolate
   * @returns {Object} Rendered template with subject and content
   */
  static renderTemplate(template, variables = {}) {
    try {
      let renderedSubject = template.subject || '';
      let renderedContent = template.content;

      // Interpolate variables in subject
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        renderedSubject = renderedSubject.replace(regex, variables[key] || '');
        renderedContent = renderedContent.replace(regex, variables[key] || '');
      });

      return {
        subject: renderedSubject,
        content: renderedContent
      };
    } catch (error) {
      console.error('Error rendering template:', error);
      return {
        subject: template.subject || '',
        content: template.content
      };
    }
  }

  /**
   * Validate template variables
   * @param {Object} template - Template object
   * @param {Object} variables - Variables to validate
   * @returns {Object} Validation result
   */
  static validateVariables(template, variables) {
    const requiredVars = template.variables?.required || [];
    const optionalVars = template.variables?.optional || [];
    const allValidVars = [...requiredVars, ...optionalVars];
    
    const missing = requiredVars.filter(varName => !(varName in variables));
    const extra = Object.keys(variables).filter(varName => !allValidVars.includes(varName));

    return {
      isValid: missing.length === 0,
      missing,
      extra
    };
  }

  /**
   * Preview template rendering
   * @param {string} templateId - Template ID
   * @param {Object} sampleVariables - Sample variables for preview
   * @returns {Promise<Object>}
   */
  static async previewTemplate(templateId, sampleVariables = {}) {
    try {
      const template = await this.getTemplateById(templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      const validation = this.validateVariables(template, sampleVariables);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `Missing required variables: ${validation.missing.join(', ')}` 
        };
      }

      const rendered = this.renderTemplate(template, sampleVariables);
      
      return {
        success: true,
        data: {
          ...rendered,
          template_name: template.name,
          channel: template.channel,
          language: template.language
        }
      };
    } catch (error) {
      console.error('Error previewing template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise<Object|null>}
   */
  static async getTemplateById(templateId) {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching template by ID:', error);
      return null;
    }
  }

  /**
   * Deactivate template
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>}
   */
  static async deactivateTemplate(templateId) {
    return await this.updateTemplate(templateId, { is_active: false });
  }

  /**
   * Activate template
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>}
   */
  static async activateTemplate(templateId) {
    return await this.updateTemplate(templateId, { is_active: true });
  }

  /**
   * Get templates by type
   * @param {string} type - Template type
   * @param {string} language - Language (optional)
   * @returns {Promise<Array>}
   */
  static async getTemplatesByType(type, language = null) {
    try {
      let query = supabase
        .from('notification_templates')
        .select('*')
        .eq('type', type)
        .eq('is_active', true);

      if (language) {
        query = query.eq('language', language);
      }

      const { data, error } = await query.order('language');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates by type:', error);
      return [];
    }
  }

  /**
   * Duplicate template with new name
   * @param {string} templateId - Source template ID
   * @param {string} newName - New template name
   * @returns {Promise<Object>}
   */
  static async duplicateTemplate(templateId, newName) {
    try {
      const original = await this.getTemplateById(templateId);
      if (!original) {
        return { success: false, error: 'Template not found' };
      }

      const duplicateData = {
        name: newName,
        channel: original.channel,
        type: original.type,
        language: original.language,
        subject: original.subject,
        content: original.content,
        variables: original.variables,
        is_active: false // New templates are inactive by default
      };

      return await this.createTemplate(duplicateData);
    } catch (error) {
      console.error('Error duplicating template:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = NotificationTemplateService;