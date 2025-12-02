package org.example.home.repository;

import org.example.home.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {
    @Query("SELECT a FROM Appointment a LEFT JOIN FETCH a.customer LEFT JOIN FETCH a.provider LEFT JOIN FETCH a.provider.user LEFT JOIN FETCH a.service WHERE a.customer.id = :customerId ORDER BY a.appointmentTime DESC")
    List<Appointment> findByCustomerIdOrderByAppointmentTimeDesc(Integer customerId);
    
    @Query("SELECT a FROM Appointment a LEFT JOIN FETCH a.customer LEFT JOIN FETCH a.provider LEFT JOIN FETCH a.provider.user LEFT JOIN FETCH a.service WHERE a.provider.id = :providerId ORDER BY a.appointmentTime DESC")
    List<Appointment> findByProviderIdOrderByAppointmentTimeDesc(Integer providerId);
    
    @Query("SELECT a FROM Appointment a LEFT JOIN FETCH a.customer LEFT JOIN FETCH a.provider LEFT JOIN FETCH a.provider.user LEFT JOIN FETCH a.service WHERE a.provider.id = :providerId AND a.appointmentTime BETWEEN :start AND :end ORDER BY a.appointmentTime ASC")
    List<Appointment> findByProviderIdAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(Integer providerId, LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT a FROM Appointment a LEFT JOIN FETCH a.customer LEFT JOIN FETCH a.provider LEFT JOIN FETCH a.provider.user LEFT JOIN FETCH a.service")
    List<Appointment> findAll();
}
