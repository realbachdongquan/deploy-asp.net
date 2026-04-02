using ConnectDB.Data;
using ConnectDB.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
// [Authorize(Roles = "Admin")] // Tùy chọn bật sau cho Admin.
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PaymentsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/payments
    [HttpGet]
    public async Task<IActionResult> GetPayments()
    {
        var payments = await _context.Payments
            .Include(p => p.Ticket).ThenInclude(t => t.User)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(payments);
    }

    // GET: api/payments/id
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPayment(int id)
    {
        var payment = await _context.Payments
            .Include(p => p.Ticket).ThenInclude(t => t.User)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null) return NotFound();
        return Ok(payment);
    }

    // PUT: api/payments/id (Cập nhật trạng thái)
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePayment(int id, Payment payment)
    {
        if (id != payment.Id) return BadRequest();

        _context.Entry(payment).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/payments/id
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePayment(int id)
    {
        var payment = await _context.Payments.FindAsync(id);
        if (payment == null) return NotFound();

        _context.Payments.Remove(payment);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
