@app.route('/api/admin/payments/<id>/update-date', methods=['PUT'])
def admin_update_payment_date(id):
    """Admin endpoint to force update payment date (bypasses closed case check)"""
    try:
        payment_id = parse_object_id(id)
        data = request.json
        
        new_payment_date = data.get('payment_date')
        if not new_payment_date:
            return jsonify({'error': 'payment_date is required'}), 400
        
        # Parse the date
        if isinstance(new_payment_date, str):
            new_payment_date = datetime.fromisoformat(new_payment_date.replace('Z', '+00:00'))
        
        # Update the payment
        result = db.payments.update_one(
            {'_id': payment_id},
            {'$set': {
                'payment_date': new_payment_date,
                'updated_at': datetime.now()
            }}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Payment date updated successfully', 'payment_id': str(payment_id)})
        return jsonify({'error': 'Payment not found'}), 404
    except Exception as e:
        logging.error(f"Error updating payment date: {e}")
        return jsonify({'error': str(e)}), 500
