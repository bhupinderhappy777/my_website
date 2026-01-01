import { useEffect, useState } from 'react';
import pdfFields from '../data/kyc_pdf_fields.json';
import logger from '../utils/logger';

/**
 * Comprehensive KYC Form Component for EN KYC 3057 template
 * Collects all required KYC information across 5 main sections
 */
export default function KYCForm({ register, setValue, client }) {
  const [showPdfFields, setShowPdfFields] = useState(false);
  useEffect(() => {
    logger.info('KYCForm mounted');
  }, []);
  // Prefill form with existing client data when component mounts or client changes
  useEffect(() => {
    if (!client) return;

    logger.debug('KYCForm prefill triggered', { clientId: client?.id });

    // Prefill all available client fields
    const fields = [
      'title', 'first_name', 'last_name', 'sin', 'dob',
      'address', 'city', 'province', 'postal_code',
      'phone_residence', 'phone_business', 'email',
      'employer', 'employer_address', 'occupation',
      'annual_income', 'net_worth', 'liquid_assets', 'fixed_assets', 'liabilities',
      'investment_knowledge', 'risk_tolerance', 'investment_objective',
      'language_preference', 'tax_resident_canada', 'tax_resident_us', 'tax_resident_other',
      'third_party_interest', 'pep_status', 'privacy_consent',
      'account_type', 'plan_status', 'plan_id', 'plan_type',
      'time_horizon', 'investment_purpose'
    ];
    const prefilledCount = fields.reduce((c, f) => c + ((client[f] !== undefined && client[f] !== null) ? 1 : 0), 0);

    fields.forEach((field) => {
      if (client[field] !== undefined && client[field] !== null) {
        setValue(field, String(client[field]));
      }
    });

    logger.debug('KYCForm prefill completed', { prefilledCount });
  }, [client, setValue]);

  return (
    <div className="space-y-8">
      {/* Section 1: Client Personal Information */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-primary-500">
          1. Client Personal Information
        </h3>

        {/* Identity */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Identity
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <select
                {...register('title')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              >
                <option value="">Select Title</option>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Miss">Miss</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name *
              </label>
              <input
                {...register('first_name')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name *
              </label>
              <input
                {...register('last_name')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Social Insurance Number (SIN)
              </label>
              <input
                {...register('sin')}
                placeholder="XXX-XXX-XXX"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                {...register('dob')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Contact Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Home Address
              </label>
              <input
                {...register('address')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City
              </label>
              <input
                {...register('city')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Province
              </label>
              <select
                {...register('province')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              >
                <option value="">Select Province</option>
                <option value="AB">Alberta</option>
                <option value="BC">British Columbia</option>
                <option value="MB">Manitoba</option>
                <option value="NB">New Brunswick</option>
                <option value="NL">Newfoundland and Labrador</option>
                <option value="NS">Nova Scotia</option>
                <option value="NT">Northwest Territories</option>
                <option value="NU">Nunavut</option>
                <option value="ON">Ontario</option>
                <option value="PE">Prince Edward Island</option>
                <option value="QC">Quebec</option>
                <option value="SK">Saskatchewan</option>
                <option value="YT">Yukon</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Postal Code
              </label>
              <input
                {...register('postal_code')}
                placeholder="A1A 1A1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Residence Phone
              </label>
              <input
                type="tel"
                {...register('phone_residence')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Business Phone
              </label>
              <input
                type="tel"
                {...register('phone_business')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>
          </div>
        </div>

        {/* Employment */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Employment Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employer Name
              </label>
              <input
                {...register('employer')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Occupation / Nature of Business
              </label>
              <input
                {...register('occupation')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employer Address
              </label>
              <input
                {...register('employer_address')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>
          </div>
        </div>

        {/* Joint Applicant (if applicable) */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Joint Applicant (if applicable)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                {...register('joint_applicant_name')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SIN
              </label>
              <input
                {...register('joint_applicant_sin')}
                placeholder="XXX-XXX-XXX"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                {...register('joint_applicant_dob')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                {...register('joint_applicant_phone')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <input
                {...register('joint_applicant_address')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employer
              </label>
              <input
                {...register('joint_applicant_employer')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Occupation
              </label>
              <input
                {...register('joint_applicant_occupation')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              />
            </div>
          </div>
        </div>

        {/* Language Preference */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Language Preference
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preferred Language
              </label>
              <select
                {...register('language_preference')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              >
                <option value="">Select Language</option>
                <option value="English">English</option>
                <option value="French">French</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Regulatory & Tax Declarations */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-primary-500">
          2. Regulatory & Tax Declarations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Tax Residency */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Tax Residency
            </h4>
          </div>

          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('tax_resident_canada')}
                className="w-5 h-5 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tax Resident of Canada
              </span>
            </label>
          </div>

          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('tax_resident_us')}
                className="w-5 h-5 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tax Resident of U.S.
              </span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tax Resident of Other Jurisdiction (specify)
            </label>
            <input
              {...register('tax_resident_other')}
              placeholder="Enter jurisdiction if applicable"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          {/* Third-Party Interest */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-4">
              Third-Party Interest
            </h4>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('third_party_interest')}
                className="w-5 h-5 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Does anyone else have a financial interest in or trading authorization for this account?
              </span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              If yes, provide details
            </label>
            <textarea
              {...register('third_party_details')}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          {/* PEP/HIO Status */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-4">
              PEP/HIO Status
            </h4>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('pep_status')}
                className="w-5 h-5 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Are you, a family member, or a close associate a Politically Exposed Person (PEP) or Head of an International Organization (HIO)?
              </span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              If yes, provide details
            </label>
            <textarea
              {...register('pep_details')}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          {/* Privacy Consent */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-4">
              Privacy Consent
            </h4>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('privacy_consent')}
                className="w-5 h-5 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                I agree to receive marketing communications
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* Section 3: Know Your Client (KYC) Data */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-primary-500">
          3. Know Your Client (KYC) Data
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Annual Income */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Annual Income (Primary Applicant)
            </label>
            <select
              {...register('annual_income')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            >
              <option value="">Select Income Bracket</option>
              <option value="Under $25,000">Under $25,000</option>
              <option value="$25,000 - $49,999">$25,000 - $49,999</option>
              <option value="$50,000 - $74,999">$50,000 - $74,999</option>
              <option value="$75,000 - $99,999">$75,000 - $99,999</option>
              <option value="$100,000 - $124,999">$100,000 - $124,999</option>
              <option value="$125,000 - $199,999">$125,000 - $199,999</option>
              <option value="$200,000 - $999,999">$200,000 - $999,999</option>
              <option value="$1,000,000+">$1,000,000+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Annual Income (Joint Applicant)
            </label>
            <select
              {...register('joint_applicant_annual_income')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            >
              <option value="">Select Income Bracket</option>
              <option value="Under $25,000">Under $25,000</option>
              <option value="$25,000 - $49,999">$25,000 - $49,999</option>
              <option value="$50,000 - $74,999">$50,000 - $74,999</option>
              <option value="$75,000 - $99,999">$75,000 - $99,999</option>
              <option value="$100,000 - $124,999">$100,000 - $124,999</option>
              <option value="$125,000 - $199,999">$125,000 - $199,999</option>
              <option value="$200,000 - $999,999">$200,000 - $999,999</option>
              <option value="$1,000,000+">$1,000,000+</option>
            </select>
          </div>

          {/* Net Worth (Numeric) */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-4">
              Net Worth (Primary Applicant)
            </h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Liquid Assets
            </label>
            <input
              type="number"
              {...register('liquid_assets')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fixed Assets
            </label>
            <input
              type="number"
              {...register('fixed_assets')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Liabilities
            </label>
            <input
              type="number"
              {...register('liabilities')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Net Worth (Calculated)
            </label>
            <input
              type="number"
              {...register('net_worth')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          {/* Net Worth (Joint Applicant) */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-4">
              Net Worth (Joint Applicant)
            </h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Liquid Assets
            </label>
            <input
              type="number"
              {...register('joint_liquid_assets')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fixed Assets
            </label>
            <input
              type="number"
              {...register('joint_fixed_assets')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Liabilities
            </label>
            <input
              type="number"
              {...register('joint_liabilities')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Net Worth (Calculated)
            </label>
            <input
              type="number"
              {...register('joint_net_worth')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          {/* Investment Knowledge */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-4">
              Investment Knowledge & Experience
            </h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Investment Knowledge (Primary)
            </label>
            <select
              {...register('investment_knowledge')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            >
              <option value="">Select Level</option>
              <option value="Novice">Novice</option>
              <option value="Fair">Fair</option>
              <option value="Good">Good</option>
              <option value="Sophisticated">Sophisticated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Investment Knowledge (Joint)
            </label>
            <select
              {...register('joint_investment_knowledge')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            >
              <option value="">Select Level</option>
              <option value="Novice">Novice</option>
              <option value="Fair">Fair</option>
              <option value="Good">Good</option>
              <option value="Sophisticated">Sophisticated</option>
            </select>
          </div>

          {/* Existing Holdings */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-4">
              Existing Holdings (Select all that apply)
            </h4>
          </div>

          <div className="md:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('holdings_bonds')}
                  className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Bonds</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('holdings_stocks')}
                  className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Stocks</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('holdings_mutual_funds')}
                  className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Mutual Funds</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('holdings_etfs')}
                  className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">ETFs</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('holdings_gics')}
                  className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">GICs</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('holdings_real_estate')}
                  className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Real Estate</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Investment Instructions */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-primary-500">
          4. Investment Instructions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Account Setup */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Account Setup
            </h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Type
            </label>
            <select
              {...register('account_type')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            >
              <option value="">Select Type</option>
              <option value="Individual">Individual</option>
              <option value="Joint">Joint</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plan Status
            </label>
            <select
              {...register('plan_status')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            >
              <option value="">Select Status</option>
              <option value="New">New</option>
              <option value="Updated">Updated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plan ID
            </label>
            <input
              {...register('plan_id')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plan Type
            </label>
            <select
              {...register('plan_type')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            >
              <option value="">Select Plan Type</option>
              <option value="Non-Registered">Non-Registered</option>
              <option value="RRSP">RRSP</option>
              <option value="RESP">RESP</option>
              <option value="RRIF">RRIF</option>
              <option value="LIRA">LIRA</option>
              <option value="TFSA">TFSA</option>
              <option value="SRSP">SRSP</option>
              <option value="RDSP">RDSP</option>
              <option value="LIF">LIF</option>
            </select>
          </div>

          {/* Investment Objectives (Totaling 100%) */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-4">
              Investment Objectives (Must total 100%)
            </h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Safety (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              {...register('objective_safety')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Income (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              {...register('objective_income')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Growth (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              {...register('objective_growth')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Speculative (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              {...register('objective_speculative')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          {/* Risk Tolerance (Totaling 100%) */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-4">
              Risk Tolerance (Must total 100%)
            </h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Low (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              {...register('risk_low')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Low/Medium (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              {...register('risk_low_medium')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Medium (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              {...register('risk_medium')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Medium/High (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              {...register('risk_medium_high')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              High (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              {...register('risk_high')}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          {/* Time Horizon */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-4">
              Investment Time Horizon & Purpose
            </h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time Horizon
            </label>
            <select
              {...register('time_horizon')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            >
              <option value="">Select Time Horizon</option>
              <option value="<1 year">Less than 1 year</option>
              <option value="1-3 years">1-3 years</option>
              <option value="4-6 years">4-6 years</option>
              <option value="7-9 years">7-9 years</option>
              <option value="10+ years">10+ years</option>
              <option value="20+ years">20+ years</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Investment Purpose
            </label>
            <select
              {...register('investment_purpose')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            >
              <option value="">Select Purpose</option>
              <option value="Retirement Planning">Retirement Planning</option>
              <option value="Estate Planning">Estate Planning</option>
              <option value="Child Education">Child Education</option>
              <option value="Wealth Accumulation">Wealth Accumulation</option>
              <option value="Tax Planning">Tax Planning</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section 5: Identity Verification */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-primary-500">
          5. Identity Verification (For Agent Use)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* ID Type and Details */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Identification Document
            </h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ID Type
            </label>
            <select
              {...register('id_type')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            >
              <option value="">Select ID Type</option>
              <option value="Driver's License">Driver's License</option>
              <option value="Birth Certificate">Birth Certificate</option>
              <option value="Passport">Passport</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Document Number
            </label>
            <input
              {...register('id_number')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Jurisdiction of Issue
            </label>
            <input
              {...register('id_jurisdiction')}
              placeholder="e.g., British Columbia"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              {...register('id_expiry')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Citizenship
            </label>
            <input
              {...register('citizenship')}
              placeholder="e.g., Canada"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          {/* Banking Information */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-4">
              Banking Information
            </h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Institution Name
            </label>
            <input
              {...register('bank_name')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Transit Number
            </label>
            <input
              {...register('bank_transit')}
              placeholder="00000"
              maxLength="5"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Institution Number
            </label>
            <input
              {...register('bank_institution')}
              placeholder="000"
              maxLength="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Number
            </label>
            <input
              {...register('bank_account')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
          </div>
        </div>
      </section>

      {/* Advanced: raw PDF fields (can be used to fill any field present in the PDF) */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Advanced PDF Fields</h3>
          <button
            type="button"
            onClick={() => setShowPdfFields((s) => !s)}
            className="text-sm text-primary-600 hover:underline"
          >
            {showPdfFields ? 'Hide' : 'Show'} PDF fields
          </button>
        </div>

        {showPdfFields && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pdfFields.map((f) => (
              <div key={f.name} className="flex items-center gap-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-64">
                  {f.name}
                </label>
                <div className="flex-1">
                  {f.type === 'Tx' ? (
                    <input
                      {...register(f.name)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <input
                      type="checkbox"
                      {...register(f.name)}
                      className="w-5 h-5"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
