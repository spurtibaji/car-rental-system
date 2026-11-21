import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import type { Car } from '../../data/cars';
import ConfirmModal from '../../components/ConfirmModal';

export default function CarManagement() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('suv');
  const [year, setYear] = useState(2024);
  const [seats, setSeats] = useState(5);
  const [transmission, setTransmission] = useState('Automatic');
  const [fuel, setFuel] = useState('Petrol');
  const [mileage, setMileage] = useState('16 kmpl');
  const [licensePlate, setLicensePlate] = useState('');
  const [color, setColor] = useState('Polar White');
  const [image, setImage] = useState('');
  const [priceHourly, setPriceHourly] = useState(250);
  const [priceDaily, setPriceDaily] = useState(2500);
  const [priceWeekly, setPriceWeekly] = useState(15000);

  // Delete Confirmation Modal State
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function loadCars() {
    setLoading(true);
    try {
      const data = await adminApi.listCars();
      if (Array.isArray(data)) {
        setCars(data as Car[]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vehicles list');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCars();
  }, []);

  async function handleToggleAvailability(car: Car) {
    try {
      const updated = await adminApi.toggleCarAvailability(car.id, !car.available);
      setCars(prev =>
        prev.map(c => (c.id === car.id ? { ...c, available: updated?.available ?? !c.available } : c))
      );
      setActionNotice({
        type: 'success',
        message: `Vehicle "${car.name}" status updated to ${updated?.available ?? !car.available ? 'Available' : 'Unavailable'}.`,
      });
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to toggle vehicle availability',
      });
      setTimeout(() => setActionNotice(null), 4000);
    }
  }

  async function handleConfirmDelete() {
    if (!carToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await adminApi.deleteCar(carToDelete.id);
      setCars(prev => prev.filter(c => c.id !== carToDelete.id));
      const deletedName = carToDelete.name;
      setCarToDelete(null);
      setActionNotice({
        type: 'success',
        message: `Vehicle "${deletedName}" has been removed from the fleet.`,
      });
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete vehicle. It may have active bookings.');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleAddCar(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!name || !licensePlate) {
      setFormError('Vehicle name and license plate are required.');
      return;
    }

    setSubmitting(true);
    try {
      const categoryMapping: Record<string, string> = {
        suv: 'SUV',
        sedan: 'Sedan',
        luxury: 'Luxury',
        hatchback: 'Hatchback',
        electric: 'Electric',
        sport: 'Luxury',
        '7-seater': '7-Seater',
      };

      const cleanCategory = categoryMapping[type.toLowerCase()] || type;
      const cleanMileage = parseFloat(String(mileage).replace(/[^0-9.]/g, '')) || 16.0;

      const payload = {
        name,
        brand: brand || name.split(' ')[0],
        model: model || name.split(' ').slice(1).join(' ') || 'Base',
        category: cleanCategory,
        type: cleanCategory,
        year: Number(year),
        seats: Number(seats),
        transmission,
        fuel,
        mileage: cleanMileage,
        license_plate: licensePlate,
        color: color || 'Polar White',
        image: image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
        hourly_price: Number(priceHourly),
        daily_price: Number(priceDaily),
        weekly_price: Number(priceWeekly),
        price_hourly: Number(priceHourly),
        price_daily: Number(priceDaily),
        price_weekly: Number(priceWeekly),
        available: true,
      };

      await adminApi.addCar(payload);
      setShowAddModal(false);
      resetForm();
      await loadCars();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add vehicle');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setName('');
    setBrand('');
    setModel('');
    setType('SUV');
    setYear(2024);
    setSeats(5);
    setTransmission('Automatic');
    setFuel('Petrol');
    setMileage('16 kmpl');
    setLicensePlate('');
    setColor('Polar White');
    setImage('');
    setPriceHourly(250);
    setPriceDaily(2500);
    setPriceWeekly(15000);
    setFormError('');
  }

  // Filter cars
  const filteredCars = cars.filter(car => {
    const matchesSearch =
      car.name.toLowerCase().includes(search.toLowerCase()) ||
      (car.license_plate && car.license_plate.toLowerCase().includes(search.toLowerCase())) ||
      (car.brand && car.brand.toLowerCase().includes(search.toLowerCase()));
    const matchesType = selectedType === 'all' || car.type?.toLowerCase() === selectedType.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground">
            Fleet Vehicle Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor availability statuses, adjust pricing rates, or commission new vehicles
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold transition-colors shadow-md shadow-primary/20 cursor-pointer"
        >
          + Add New Vehicle
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2 ${
            actionNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              : 'bg-red-500/10 border-red-500/25 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{actionNotice.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-muted-foreground hover:text-foreground text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name, plate, or brand..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-muted border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['all', 'luxury', 'suv', 'sedan', 'hatchback', 'electric', 'sport'].map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                selectedType === t
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading fleet catalog...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-400/10 border border-red-400/30 rounded-xl text-red-400 text-xs">
          {error}
        </div>
      ) : filteredCars.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-xs text-muted-foreground">
          No vehicles matching the filter criteria.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Plate No.</th>
                  <th className="py-3.5 px-4">Daily Rate</th>
                  <th className="py-3.5 px-4">Specs</th>
                  <th className="py-3.5 px-4 text-center">Availability Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCars.map(car => (
                  <tr key={car.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={car.image}
                          alt={car.name}
                          className="w-12 h-9 object-cover rounded-lg border border-border bg-muted shrink-0"
                        />
                        <div>
                          <p className="font-display font-bold text-foreground">{car.name}</p>
                          <p className="text-[10px] text-muted-foreground">{car.brand || 'DriveNow'} · {car.year || 2024}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium uppercase text-[11px] text-muted-foreground">
                      {car.type}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                      {car.license_plate || 'MH-02-DN-0001'}
                    </td>

                    <td className="py-3.5 px-4 font-display font-bold text-foreground">
                      ₹{(car.price?.daily || 2500).toLocaleString()} / day
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground">
                      {car.seats} seats · {car.fuel} · {car.transmission}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleAvailability(car)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                          car.available
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                        }`}
                      >
                        {car.available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setCarToDelete(car);
                        }}
                        className="px-2.5 py-1 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                        title="Decommission vehicle"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <h3 className="font-display font-black text-lg text-foreground">Add Vehicle to Fleet</h3>
                <p className="text-xs text-muted-foreground">Register new rental car with specs and pricing</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-400/10 border border-red-400/30 rounded-xl text-red-400 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddCar} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-foreground">
                    Vehicle Model Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Hyundai Creta SX"
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-foreground">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={licensePlate}
                    onChange={e => setLicensePlate(e.target.value)}
                    placeholder="e.g. MH-02-DN-9988"
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-foreground">Category</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground outline-none focus:border-primary"
                  >
                    <option value="SUV">SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Electric">Electric</option>
                    <option value="7-Seater">7-Seater</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-foreground">Seats</label>
                  <input
                    type="number"
                    value={seats}
                    onChange={e => setSeats(Number(e.target.value))}
                    min="2"
                    max="12"
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-foreground">Model Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-foreground">Transmission</label>
                  <select
                    value={transmission}
                    onChange={e => setTransmission(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground outline-none focus:border-primary"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-foreground">Fuel</label>
                  <select
                    value={fuel}
                    onChange={e => setFuel(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground outline-none focus:border-primary"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-foreground">Mileage</label>
                  <input
                    type="text"
                    value={mileage}
                    onChange={e => setMileage(e.target.value)}
                    placeholder="18 kmpl"
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-foreground">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    value={priceHourly}
                    onChange={e => setPriceHourly(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-foreground">Daily Rate (₹)</label>
                  <input
                    type="number"
                    value={priceDaily}
                    onChange={e => setPriceDaily(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-foreground">Weekly Rate (₹)</label>
                  <input
                    type="number"
                    value={priceWeekly}
                    onChange={e => setPriceWeekly(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-foreground">Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    placeholder="e.g. Polar White"
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-foreground">Image URL</label>
                  <input
                    type="url"
                    value={image}
                    onChange={e => setImage(e.target.value)}
                    placeholder="https://upload.wikimedia.org/..."
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-xl hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-primary/20"
                >
                  {submitting ? 'Adding...' : 'Commission Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern In-App Decommission Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(carToDelete)}
        onClose={() => {
          if (!isDeleting) {
            setCarToDelete(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title={`Decommission ${carToDelete?.name || 'Vehicle'}?`}
        message={`Are you sure you want to remove "${carToDelete?.name}" (${carToDelete?.license_plate || carToDelete?.id}) from the fleet catalog? This will permanently remove the vehicle and its maintenance logs.`}
        confirmText="Yes, Decommission"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
