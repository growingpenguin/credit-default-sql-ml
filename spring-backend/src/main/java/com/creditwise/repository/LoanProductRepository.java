package com.creditwise.repository;

import com.creditwise.entity.LoanProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Loan Product Repository
 * =======================
 * JPA Repository for LoanProduct entity with custom query methods.
 */
@Repository
public interface LoanProductRepository extends JpaRepository<LoanProduct, Long> {
    
    /**
     * Find loan product by product ID.
     */
    Optional<LoanProduct> findByProductId(String productId);
    
    /**
     * Find all active loan products.
     */
    List<LoanProduct> findByIsActiveTrueOrderByMinAprAsc();
    
    /**
     * Find loan products by loan type.
     */
    List<LoanProduct> findByLoanTypeAndIsActiveTrueOrderByMinAprAsc(String loanType);
    
    /**
     * Find loan products eligible for a given credit score.
     */
    @Query("SELECT lp FROM LoanProduct lp WHERE lp.isActive = true " +
           "AND lp.minCreditScore <= :creditScore " +
           "AND lp.maxCreditScore >= :creditScore " +
           "ORDER BY lp.minApr ASC")
    List<LoanProduct> findEligibleProducts(@Param("creditScore") Integer creditScore);
    
    /**
     * Find loan products by grade.
     */
    List<LoanProduct> findByGradeAndIsActiveTrueOrderByMinAprAsc(String grade);
    
    /**
     * Find loan products by lender.
     */
    List<LoanProduct> findByLenderNameAndIsActiveTrueOrderByMinAprAsc(String lenderName);
}

