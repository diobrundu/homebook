import React, { useEffect, useState } from 'react';
import { Service, Appointment, ServiceProvider } from '../types';
import RealApi from '../services/realApi';
import { Button, PageContainer, Input, Select, TextArea } from '../components/Shared';
import { Star, Clock, MapPin, CheckCircle, Search, Shield, Award, ArrowRight, User as UserIcon, Calendar, Briefcase } from 'lucide-react';

interface PublicProps {
  onNavigate: (path: string) => void;
}

// --- Landing Page ---
export const LandingPage: React.FC<PublicProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <div className="relative bg-brand-700 overflow-hidden">
        <div className="absolute inset-0">
          <img className="w-full h-full object-cover opacity-20" src="https://picsum.photos/1920/1080" alt="Cleaning background" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">Professional Home Services<br />at Your Doorstep</h1>
          <p className="mt-6 text-xl text-brand-100 max-w-3xl">
            Book trusted cleaners, nannies, and movers instantly. Verified professionals, transparent pricing, and 100% satisfaction guaranteed.
          </p>
          <div className="mt-10 flex gap-4">
            <Button size="lg" className="bg-white text-brand-700 hover:bg-gray-100" onClick={() => onNavigate('/services')}>Book a Service</Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-brand-600" onClick={() => onNavigate('/register')}>Join as Pro</Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-brand-100 rounded-full text-brand-600 mb-4">
                        <CheckCircle className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Verified Professionals</h3>
                    <p className="mt-2 text-gray-600">All providers undergo strict background checks and skill assessments.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-brand-100 rounded-full text-brand-600 mb-4">
                        <Clock className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Flexible Scheduling</h3>
                    <p className="mt-2 text-gray-600">Book for today, tomorrow, or next month. We work around your time.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-brand-100 rounded-full text-brand-600 mb-4">
                        <Star className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Top Rated Service</h3>
                    <p className="mt-2 text-gray-600">Our professionals maintain a 4.8/5 star average rating.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Services Page ---
export const ServicesPage: React.FC<PublicProps> = ({ onNavigate }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    RealApi.getServices().then(data => {
      setServices(data);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load services:', err);
      setLoading(false);
    });
  }, []);

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Loading services...</div>;

  return (
    <PageContainer title="Our Services">
      <div className="mb-8 relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-shadow shadow-sm"
          placeholder="Search by name, category or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredServices.length === 0 ? (
        <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No services found matching "{searchTerm}"</p>
            <button onClick={() => setSearchTerm('')} className="mt-2 text-brand-600 hover:text-brand-800 font-medium">Clear search</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(service => (
            <div key={service.id} className="bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
                <div className="h-48 bg-gray-200 cursor-pointer overflow-hidden" onClick={() => onNavigate(`/service/${service.id}`)}>
                <img src={`https://picsum.photos/400/300?random=${service.id}`} alt={service.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                <div className="text-sm font-medium text-brand-600 mb-1">{service.categoryName}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-brand-600" onClick={() => onNavigate(`/service/${service.id}`)}>{service.name}</h3>
                <p className="text-gray-500 mb-4 flex-1 line-clamp-3">{service.description}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-lg font-bold text-gray-900">
                    ${service.price} <span className="text-sm font-normal text-gray-500">/{service.priceUnit}</span>
                    </span>
                    <Button onClick={() => onNavigate(`/book/${service.id}`)}>Book Now</Button>
                </div>
                </div>
            </div>
            ))}
        </div>
      )}
    </PageContainer>
  );
};

// --- Service Details Page ---
interface ServiceDetailsProps extends PublicProps {
  serviceId: string;
}

export const ServiceDetailsPage: React.FC<ServiceDetailsProps> = ({ onNavigate, serviceId }) => {
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<{user: string, rating: number, comment: string, date: string}[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const s = await RealApi.getServiceById(Number(serviceId));
        if (s) {
          setService(s);
          const r = await RealApi.getServiceReviews(s.id);
          setReviews(r);
          // Load providers for this service category to link to profiles
          const allProviders = await RealApi.getProviders();
          // In a real app we'd filter by service offering, here we do a simple filter
          const relevantProviders = s.categoryId === 1 
              ? allProviders.filter(p => p.id === 1) // Cleaner
              : allProviders.filter(p => p.id === 2); // Nanny
          setProviders(relevantProviders);
        }
      } catch (err) {
        console.error('Failed to load service details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [serviceId]);

  if (loading) return <div className="p-12 text-center text-gray-500">Loading service details...</div>;
  if (!service) return <div className="p-12 text-center text-red-500">Service not found</div>;

  return (
    <div className="bg-white min-h-screen">
      {/* Header / Hero */}
      <div className="relative bg-gray-900 h-64 md:h-80">
         <img src={`https://picsum.photos/1200/600?random=${service.id}`} className="w-full h-full object-cover opacity-40" alt={service.name} />
         <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <span className="inline-block py-1 px-3 rounded-full bg-brand-600 text-white text-xs font-semibold tracking-wide uppercase mb-3">
                {service.categoryName}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{service.name}</h1>
              <div className="flex items-center text-white/90 gap-4">
                 <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                    <span className="font-semibold text-lg">4.8</span>
                    <span className="ml-1 text-sm text-gray-300">(120+ reviews)</span>
                 </div>
                 <div className="flex items-center">
                    <Shield className="h-5 w-5 text-green-400 mr-1" />
                    <span className="text-sm">Verified Providers</span>
                 </div>
              </div>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           {/* Main Content */}
           <div className="lg:col-span-2 space-y-12">
              <section>
                 <h2 className="text-2xl font-bold text-gray-900 mb-4">About this Service</h2>
                 <p className="text-lg text-gray-600 leading-relaxed">{service.description}</p>
                 <p className="mt-4 text-gray-600 leading-relaxed">
                   Our {service.name} service is designed to provide you with top-quality results. 
                   We connect you with experienced professionals who are vetted for quality and reliability.
                   Whether you need a one-time service or regular assistance, we have you covered.
                 </p>
              </section>

              {providers.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Rated Pros</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {providers.map(p => (
                            <div key={p.id} className="border rounded-xl p-4 flex items-start hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate(`/provider-profile/${p.id}`)}>
                                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg mr-4 flex-shrink-0">
                                    {p.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 flex items-center">
                                        {p.name}
                                        <CheckCircle className="h-4 w-4 text-blue-500 ml-1" />
                                    </h4>
                                    <div className="flex items-center text-sm text-gray-500 mt-1">
                                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                        <span className="font-medium text-gray-900 mr-1">{p.rating}</span>
                                        <span>(Verified)</span>
                                    </div>
                                    <p className="text-sm text-brand-600 mt-2 font-medium">View Profile &rarr;</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
              )}

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What to Expect</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {[
                     "Fully vetted and background-checked professionals",
                     "100% Satisfaction Guarantee",
                     "Transparent pricing with no hidden fees",
                     "24/7 Customer Support",
                     "Flexible scheduling options",
                     "Top-rated equipment and supplies"
                   ].map((item, idx) => (
                     <div key={idx} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                     </div>
                   ))}
                </div>
              </section>

              <section>
                 <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
                 <div className="space-y-6">
                    {reviews.map((review, index) => (
                      <div key={index} className="bg-gray-50 p-6 rounded-xl border">
                         <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                               <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold mr-3">
                                 {review.user.charAt(0)}
                               </div>
                               <div>
                                  <h4 className="font-semibold text-gray-900">{review.user}</h4>
                                  <div className="flex items-center text-xs text-gray-500">
                                     <span>{new Date(review.date).toLocaleDateString()}</span>
                                  </div>
                               </div>
                            </div>
                            <div className="flex text-yellow-400">
                               {[...Array(5)].map((_, i) => (
                                 <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                               ))}
                            </div>
                         </div>
                         <p className="text-gray-600 italic">"{review.comment}"</p>
                      </div>
                    ))}
                 </div>
              </section>
           </div>

           {/* Sidebar */}
           <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                 {/* Booking Card */}
                 <div className="bg-white rounded-xl shadow-lg border p-6">
                    <div className="mb-6">
                       <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Starting from</p>
                       <div className="flex items-baseline mt-1">
                          <span className="text-4xl font-extrabold text-gray-900">${service.price}</span>
                          <span className="text-gray-500 ml-2 font-medium">/ {service.priceUnit}</span>
                       </div>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                       <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-5 w-5 text-gray-400 mr-3" />
                          <span>Instant Confirmation</span>
                       </div>
                       <div className="flex items-center text-sm text-gray-600">
                          <Shield className="h-5 w-5 text-gray-400 mr-3" />
                          <span>Secure Payment</span>
                       </div>
                    </div>

                    <Button className="w-full py-4 text-lg" onClick={() => onNavigate(`/book/${service.id}`)}>
                       Book Now
                    </Button>
                    <p className="text-xs text-center text-gray-500 mt-4">No charge until service is complete</p>
                 </div>

                 {/* Trust Badges */}
                 <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-start mb-4">
                       <Award className="h-8 w-8 text-blue-600 mr-4 flex-shrink-0" />
                       <div>
                          <h4 className="font-bold text-gray-900">Satisfaction Guarantee</h4>
                          <p className="text-sm text-gray-600 mt-1">If you're not happy, we'll make it right.</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Provider Profile Page ---
interface ProviderProfileProps extends PublicProps {
    providerId: string;
}

export const ProviderProfilePage: React.FC<ProviderProfileProps> = ({ onNavigate, providerId }) => {
    const [provider, setProvider] = useState<ServiceProvider | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const id = Number(providerId);
                const p = await RealApi.getProviderById(id);
                if (p) {
                    setProvider(p);
                    const s = await RealApi.getServicesByProviderId(id);
                    setServices(s);
                    const r = await RealApi.getProviderReviews(id);
                    setReviews(r);
                }
            } catch (err) {
                console.error('Failed to load provider profile:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [providerId]);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading profile...</div>;
    if (!provider) return <div className="p-12 text-center text-red-500">Provider not found</div>;

    return (
        <PageContainer>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Sidebar Info */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden sticky top-24">
                        <div className="h-32 bg-brand-600"></div>
                        <div className="px-6 pb-6 text-center -mt-12">
                            <div className="h-24 w-24 rounded-full bg-white border-4 border-white mx-auto flex items-center justify-center text-3xl font-bold text-brand-600 shadow-md">
                                {provider.name.charAt(0)}
                            </div>
                            <h2 className="mt-4 text-xl font-bold text-gray-900 flex items-center justify-center gap-1">
                                {provider.name}
                                <CheckCircle className="h-5 w-5 text-blue-500" />
                            </h2>
                            <div className="flex justify-center items-center mt-2 text-yellow-400">
                                <span className="text-gray-900 font-bold mr-1">{provider.rating}</span>
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < Math.round(provider.rating) ? 'fill-current' : 'text-gray-300'}`} />
                                ))}
                                <span className="text-gray-400 text-sm ml-1">({reviews.length} reviews)</span>
                            </div>
                            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                                {provider.introduction}
                            </p>
                            
                            <div className="mt-6 pt-6 border-t flex flex-col gap-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 flex items-center"><MapPin className="h-4 w-4 mr-1"/> Location</span>
                                    <span className="font-medium text-gray-900">Beijing/Shanghai</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 flex items-center"><Calendar className="h-4 w-4 mr-1"/> Member Since</span>
                                    <span className="font-medium text-gray-900">{new Date(provider.joinDate).getFullYear()}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 flex items-center"><Briefcase className="h-4 w-4 mr-1"/> Status</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 uppercase">
                                        Verified
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Services */}
                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Services Offered</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {services.length > 0 ? services.map(service => (
                                <div key={service.id} className="bg-white p-4 rounded-xl border shadow-sm hover:border-brand-300 transition-colors flex flex-col justify-between">
                                    <div>
                                        <div className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">{service.categoryName}</div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-2">{service.name}</h4>
                                        <p className="text-sm text-gray-500 line-clamp-2">{service.description}</p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="font-bold text-gray-900">${service.price} <span className="text-sm font-normal text-gray-500">/{service.priceUnit}</span></span>
                                        <Button size="sm" onClick={() => onNavigate(`/book/${service.id}`)}>Book Now</Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                    No specific services listed for this provider yet.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Reviews */}
                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Client Reviews</h3>
                        <div className="space-y-4">
                            {reviews.map((review, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-xl border shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                                                {review.user.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{review.user}</div>
                                                <div className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm mt-2">"{review.comment}"</p>
                                </div>
                            ))}
                            {reviews.length === 0 && (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                    No reviews yet.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </PageContainer>
    );
};

// --- Booking Page ---
interface BookingProps extends PublicProps {
  serviceId: string;
  user?: { id: number };
}

export const BookingPage: React.FC<BookingProps> = ({ onNavigate, serviceId, user }) => {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(2);
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    RealApi.getServiceById(Number(serviceId)).then(s => {
      setService(s || null);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load service:', err);
      setLoading(false);
    });
  }, [serviceId]);

  const validate = () => {
      const newErrors: Record<string, string> = {};
      
      if (!date) newErrors.date = 'Date is required';
      else {
          const selectedDate = new Date(date);
          const today = new Date();
          today.setHours(0,0,0,0);
          if (selectedDate < today) newErrors.date = 'Date cannot be in the past';
      }

      if (!time) newErrors.time = 'Time is required';
      
      if (!address.trim()) newErrors.address = 'Address is required';
      else if (address.length < 5) newErrors.address = 'Please enter a valid address (min 5 characters)';

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
        if (!user || !user.id) {
            alert('Please log in to book a service');
            onNavigate('/login');
            return;
        }
        
        // Ensure time format is correct (HH:mm:ss) for ISO 8601
        let timeFormatted = time;
        if (time.includes(':')) {
            const parts = time.split(':');
            if (parts.length === 2) {
                // HH:mm -> HH:mm:00
                timeFormatted = `${time}:00`;
            } else if (parts.length === 3) {
                // Already has seconds
                timeFormatted = time;
            }
        } else {
            // Invalid format, try to fix
            timeFormatted = `${time}:00:00`;
        }
        // Ensure date format is yyyy-MM-dd
        const appointmentDateTime = `${date}T${timeFormatted}`;
        
        // Validate the final format
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(appointmentDateTime)) {
            throw new Error('Invalid date or time format. Please check your input.');
        }
        
        console.log('Creating appointment with:', {
            customerId: user.id,
            serviceId: service.id,
            appointmentTime: appointmentDateTime,
            durationHours: duration,
            address: address
        });
        
        await RealApi.createAppointment({
            customerId: user.id, 
            serviceId: service.id,
            appointmentTime: appointmentDateTime,
            durationHours: Number(duration) || 1.0,
            address: address.trim()
        });
        alert('Booking Request Sent! Redirecting to dashboard...');
        onNavigate('/dashboard');
    } catch (error: any) {
        console.error('Booking error:', error);
        const errorMessage = error?.message || error?.error || 'Failed to book appointment. Please try again.';
        alert(`Booking failed: ${errorMessage}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading service details...</div>;
  if (!service) return <div className="p-8 text-center text-red-500">Service not found</div>;

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Book {service.name}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
           {/* Service Info Summary */}
           <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
             <div>
                <p className="text-sm text-gray-500">Rate</p>
                <p className="font-semibold text-gray-900">${service.price} / {service.priceUnit}</p>
             </div>
             {service.priceUnit === 'hour' && (
                <div>
                   <p className="text-sm text-gray-500">Estimated Total</p>
                   <p className="font-bold text-brand-600 text-lg">${service.price * duration}</p>
                </div>
             )}
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
                <Input 
                    type="date"
                    label="Date"
                    value={date}
                    onChange={e => {
                        setDate(e.target.value);
                        if (errors.date) setErrors({...errors, date: ''});
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    error={errors.date}
                />
             </div>
             <div>
                <Input 
                    type="time"
                    label="Time"
                    value={time}
                    onChange={e => {
                        setTime(e.target.value);
                        if (errors.time) setErrors({...errors, time: ''});
                    }}
                    error={errors.time}
                />
             </div>
           </div>

           {service.priceUnit === 'hour' && (
             <div>
               <Select
                label="Duration (Hours)"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
               >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={5}>5 Hours</option>
               </Select>
             </div>
           )}

           <div>
              <TextArea 
                label="Service Address"
                rows={3}
                placeholder="Enter full address including unit number"
                value={address}
                onChange={e => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors({...errors, address: ''});
                }}
                error={errors.address}
              />
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={() => onNavigate('/services')}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Confirm Booking'}</Button>
           </div>
        </form>
      </div>
    </PageContainer>
  );
};